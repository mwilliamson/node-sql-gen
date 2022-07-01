import { eq, boundParameter } from "./expressions";
import Query from "./Query";
import { compile } from "./compiler";
import { Selectable } from "./selectables";
import { column, createTable, table } from "./tables";
import type { TableColumnDefinition } from "./tables";
import types from "./types";

function from(selectable: Selectable) {
    return new Query({selectable});
}

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
