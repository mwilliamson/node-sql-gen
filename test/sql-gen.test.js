import assert from "assert";

import sql from "../";

const test = require("./test")(module)


test("select single column from table", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.id);
    assert.equal(sql.compile(query), "SELECT author.id FROM author");
});

test("select multiple columns from table", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"}),
        title: sql.column({name: "title"})
    });
    const query = sql.from(Author).select(Author.c.id, Author.c.title);
    assert.equal(sql.compile(query), "SELECT author.id, author.title FROM author");
});

test("select column with alias", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.id.as("author_id"));
    assert.equal(sql.compile(query), "SELECT author.id AS author_id FROM author");
});

test("default column alias is key of column property", () => {
    const Author = sql.table("author", {
        authorId: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.authorId);
    assert.equal(sql.compile(query), "SELECT author.id AS authorId FROM author");
});

test("select from table with alias", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const aliasedAuthor = Author.as("a");
    const query = sql.from(aliasedAuthor).select(aliasedAuthor.c.id);
    assert.equal(sql.compile(query), "SELECT a.id FROM author AS a");
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
    assert.equal(sql.compile(query), "SELECT author.id, book.id FROM author JOIN book ON author.id = book.author_id");
});

test("select from subquery", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const authors = sql.from(Author).select(Author.c.id).subquery();
    const query = sql.from(authors).select(authors.c.id);
    assert.equal(sql.compile(query), "SELECT anon_0.id FROM (SELECT author.id FROM author) AS anon_0");
});

test("select from subquery with aliased columns", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const authors = sql.from(Author).select(Author.c.id.as("authorId")).subquery();
    const query = sql.from(authors).select(authors.c.authorId);
    assert.equal(sql.compile(query), "SELECT anon_0.authorId FROM (SELECT author.id AS authorId FROM author) AS anon_0");
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
    assert.equal(sql.compile(query), "SELECT anon_0.id FROM (SELECT author.id FROM author) AS anon_0 JOIN (SELECT book.author_id FROM book) AS anon_1 ON anon_0.id = anon_1.author_id");
});

test("select distinct", () => {
    const Author = sql.table("author", {
        id: sql.column({name: "id"})
    });
    const query = sql.from(Author).select(Author.c.id).distinct();
    assert.equal(sql.compile(query), "SELECT DISTINCT author.id FROM author");
});
