# node-sql-gen

A SQL query builder, inspired by [SQLAlchemy](http://www.sqlalchemy.org/).

## Installation

    npm install graphjoiner

## Example

We can define tables using `sql.table()` and `sql.column()`:

```javascript
import sql from "node-sql-gen";

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
```

We can then define a query:

```javascript
const query = sql.from(Book)
    .join(Author, sql.eq(Book.c.authorId, Author.c.id))
    .where(sql.eq(Book.c.genre, "comedy"))
    .select(Author.c.name, Book.c.title);
```

We can use `compile()` to turn a query into a string and parameters,
ready to pass into a database connection:

```javascript
sql.compile(query)
//  {
//      "text": "SELECT author.name, book.title FROM book JOIN author ON book.author_id = author.id WHERE book.genre = ?",
//      "params": ["comedy"]
//  }
```

If using [node-sqlite3](https://github.com/mapbox/node-sqlite3):

```javascript
const {text, params} = sql.compile(query);
const database = new sqlite3.Database("path/to/database");
database.all(text, ...params);
```
