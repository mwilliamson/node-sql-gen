# node-sql-gen

A SQL query builder, inspired by [SQLAlchemy](http://www.sqlalchemy.org/).

## Installation

    npm install sql-gen

## Example

We can define tables using `sql.table()` and `sql.column()`:

```javascript
import sql from "sql-gen";

const Author = sql.table("author", {
    id: sql.column({name: "id", type: sql.types.int, primaryKey: true}),
    name: sql.column({name: "name", type: sql.types.string})
});
const Book = sql.table("book", {
    id: sql.column({name: "id", type: sql.types.int, primaryKey: true}),
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
database.all(text, ...params, (error, rows) => {
    if (error) {
        console.error(error);
    } else {
        console.log(rows);
    }
});
```

## API

### `table(name, columns)`

Represent a table in a database. Takes the following arguments:

* `name`: the name of the table in the database.

* `columns`: the columns in the table.
  The keys should be the name by which you want to refer to the columns.
  The values should be the result of calling `column()`.

Returns an instance of `Table`, which has the following properties:

* `c`: the columns of the table, which can then be used in generating queries.
  For instance:
  
      ```javascript
      const Author = table("author", {
          id: sql.column({name: "id", type: sql.types.int, primaryKey: true}),
          name: sql.column({name: "name", type: sql.types.string})
      });
      sql.from(Author).select(Author.c.name)
      ```

* `as(alias)`: create a from clause for this table with an alternate name,
  as specified by `alias`. For instance:
  
      ```javascript
      const Author = table("author", {
          id: sql.column({name: "id", type: sql.types.int, primaryKey: true}),
          name: sql.column({name: "name", type: sql.types.string})
      });
      const authorAlias = Author.as("favourite_author");
      sql.from(authorAlias).select(authorAlias.c.name).where(sql.eq(authorAlias.c.id, 42))
      ```

### `column(options)`

Represent a column in a table.

Options should be an object with the following properties:

* `name`: the name of the column in the database.

* `type`: the type of the column. Use a value from `types`.

* `primaryKey` (optional):
  set to `true` to mark this column as part of the table's primary key.
  Defaults to false.

* `nullable` (optional): 
  set to `false` to mark this column as `NOT NULL`.
  Defaults to true.

### `types`

* `types.int`: SQL integer type.
* `types.string`: SQL string type.

### `from(selectable)`

Create an instance of `Query` using `selectable` as the primary from clause.

### `Query`

`Query` is used to generate SQL queries.
It has the following properties:

* `join(selectable, condition)`:
  creates a `JOIN` clause onto the given selectable.

* `select(...columns)`:
  specify the columns to select.

* `distinct()`:
  add a `DISTINCT` qualifier to this query.

* `where(condition)`:
  add a `WHERE` clause.
  If there's already a `WHERE` clause, `condition` is added using `AND`.
  `condition` should be a SQL expression.

* `subquery()`:
  turn this query into a subquery that can then be selected from,
  similarly to a table.

### `createTable(table)`

Represents a `CREATE TABLE` statement.
Use `compile()` to compile it.

### `compile(query)`

Turn a query or statement into a query that can be executed.
Returns an object with two properties:

* `text`: the text of the query
* `params`: any parameters that have been generated during compilation of the query
