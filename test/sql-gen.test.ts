import assert from "assert";

import sql, { TableColumn } from "../";
import { Compiler } from "../lib/compiler";
import { BoundColumn } from "../lib/expressions";
import { Statement } from "../lib/statements";

const test = require("./test")(module)

// TODO: operator precedence


test("select single column from table", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.id);
    assertQuery(query, "SELECT author.id FROM author");
});

test("select multiple columns from table", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"}),
        title: sql.column({name: "title"})
    });
    const query = sql.from(Author).select(Author.c.id, Author.c.title);
    assertQuery(query, "SELECT author.id, author.title FROM author");
});

test("select column with alias", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.id.as("author_id"));
    assertQuery(query, "SELECT author.id AS author_id FROM author");
});

test("default column alias is key of column property", () => {
    const Author = sql.table("author", {
        authorId: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.authorId);
    assertQuery(query, "SELECT author.id AS authorId FROM author");
});

test("select from table with alias", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const aliasedAuthor = Author.as("a");
    const query = sql.from(aliasedAuthor).select(aliasedAuthor.c.id);
    assertQuery(query, "SELECT a.id FROM author AS a");
});

test("inner join", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const Book = sql.table("book", {
        id: sql.column({name: "id"}),
        authorId: sql.column({name: "author_id"})
    });
    const query = sql
        .from(Author)
        .join(Book, sql.eq(Author.c.id, Book.c.authorId))
        .select(Author.c.id, Book.c.id);
    assertQuery(query, "SELECT author.id, book.id FROM author JOIN book ON author.id = book.author_id");
});

test("select from subquery", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const authors = sql.from(Author).select(Author.c.id).subquery();
    const query = sql.from(authors).select(authors.c.id);
    assertQuery(query, "SELECT anon_0.id FROM (SELECT author.id FROM author) AS anon_0");
});

test("select from subquery with aliased columns", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const authors = sql.from(Author).select(Author.c.id.as("authorId")).subquery();
    const query = sql.from(authors).select(authors.c.authorId);
    assertQuery(query, "SELECT anon_0.authorId FROM (SELECT author.id AS authorId FROM author) AS anon_0");
});

test("select from multiple subqueries", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const Book = sql.table("book", {
        author_id: sql.column({name: "author_id"})
    });
    const authors = sql.from(Author).select(Author.c.id).subquery();
    const books = sql.from(Book).select(Book.c.author_id).subquery();
    const query = sql
        .from(authors)
        .join(books, sql.eq(authors.c.id, books.c.author_id))
        .select(authors.c.id);
    assertQuery(query, "SELECT anon_0.id FROM (SELECT author.id FROM author) AS anon_0 JOIN (SELECT book.author_id FROM book) AS anon_1 ON anon_0.id = anon_1.author_id");
});

test("select distinct", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.id).distinct();
    assertQuery(query, "SELECT DISTINCT author.id FROM author");
});

test("select bound parameter", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(sql.boundParameter({value: 1}));
    assertQuery(query, "SELECT ? FROM author", 1);
});

test("literal in select is coerced to bound parameter", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(1);
    assertQuery(query, "SELECT ? FROM author", 1);
});

test("single where call", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.id).where(sql.eq(Author.c.id, 1));
    assertQuery(query, "SELECT author.id FROM author WHERE author.id = ?", 1);
});

test("multiple where calls generate single WHERE clause with ANDs", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author)
        .select(Author.c.id)
        .where(sql.eq(Author.c.id, 1))
        .where(sql.eq(Author.c.id, 2));
    assertQuery(query, "SELECT author.id FROM author WHERE author.id = ? AND author.id = ?", 1, 2);
});

test("create table", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id", type: sql.types.int}),
        title: sql.column({name: "title", type: sql.types.string})
    });
    const query = sql.createTable(Author);
    assertQuery(query, "CREATE TABLE author (id INTEGER NOT NULL, title VARCHAR NOT NULL)");
});

test("create columns", {
    "primary key": () => {
        const column = sql.column({name: "id", type: sql.types.int, primaryKey: true});
        assertColumn(column, "id INTEGER PRIMARY KEY");
    },

    "nullable": () => {
        const column = sql.column({name: "id", type: sql.types.int, nullable: true});
        assertColumn(column, "id INTEGER");
    },

    "not null": () => {
        const column = sql.column({name: "id", type: sql.types.int, nullable: false});
        assertColumn(column, "id INTEGER NOT NULL");
    }
});

test("table primary key property", {
    "no primary key columns": () => {
        const Author = sql.table("author", {
            id: sql.column({name: "id", type: sql.types.int}),
            name: sql.column({name: "name", type: sql.types.string})
        });
        assert.equal(Author.primaryKey, null);
    },
    "one primary key column": () => {
        const Author = sql.table("author", {
            id: sql.column({name: "id", type: sql.types.int, primaryKey: true}),
            name: sql.column({name: "name", type: sql.types.string})
        });
        assert.deepEqual(
            Author.primaryKey?.columns.map(column => (column as BoundColumn).key()),
            ["id"]
        );
    },
    "multiple primary key columns": () => {
        const Author = sql.table("author", {
            id: sql.column({name: "id", type: sql.types.int, primaryKey: true}),
            name: sql.column({name: "name", type: sql.types.string, primaryKey: true})
        });
        assert.deepEqual(
            Author.primaryKey?.columns.map(column => (column as BoundColumn).key()),
            ["id", "name"]
        );
    }
});

test("README.md", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id", type: sql.types.int}),
        name: sql.column({name: "name", type: sql.types.string})
    });
    const Book = sql.table("book", {
        id: sql.column({name: "id", type: sql.types.int}),
        authorId: sql.column({name: "author_id", type: sql.types.int}),
        title: sql.column({name: "title", type: sql.types.string}),
        genre: sql.column({name: "genre", type: sql.types.string})
    });

    const query = sql.from(Book)
        .join(Author, sql.eq(Book.c.authorId, Author.c.id))
        .where(sql.eq(Book.c.genre, "comedy"))
        .select(Author.c.name, Book.c.title);

    assertQuery(query, "SELECT author.name, book.title FROM book JOIN author ON book.author_id = author.id WHERE book.genre = ?", "comedy");
});

function assertColumn(column: TableColumn, expectedSql: string) {
    const compiler = new Compiler();
    const text = column.compileCreate(compiler);
    assert.equal(text, expectedSql);
    assert.deepEqual(compiler.params, []);
}

function assertQuery(query: Statement, expectedSql: string, ...expectedParams: Array<unknown>) {
    assert.deepEqual(
        sql.compile(query),
        {
            text: expectedSql,
            params: expectedParams
        }
    );
}
