import { map } from "lodash";

import { eq, boundParameter } from "./expressions";
import Query from "./Query";
import { compile } from "./compiler";
import { Selectable } from "./selectables";
import { column, createTable, table } from "./tables";
import type { TableColumnDefinition } from "./tables";

function from(selectable: Selectable) {
    return new Query({selectable});
}

const types = {
    int: "INTEGER",
    string: "VARCHAR"
};

export default {
    table,
    column,
    from,
    eq,
    boundParameter,
    compile,
    types,
    createTable
}

export {TableColumnDefinition}
