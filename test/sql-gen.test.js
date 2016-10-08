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
