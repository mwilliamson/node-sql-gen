import { eq, boundParameter, Expression } from "./expressions";
import Query from "./Query";
import { compile } from "./compiler";
import { OutputColumnTypes, Selectable } from "./selectables";
import { column, createTable, table } from "./tables";
import type { TableColumnDefinition } from "./tables";
import types from "./types";

function from(selectable: Selectable<OutputColumnTypes>) {
    return new Query<{}>({columns: {}, selectable});
}

function int(value: number): Expression {
    return boundParameter({sqlType: types.int, value: value});
}

function string(value: string): Expression {
    return boundParameter({sqlType: types.string, value: value});
}

export default {
    table,
    column,
    from,
    eq,
    boundParameter,
    int,
    string,
    compile,
    types,
    createTable
}

export {TableColumnDefinition}
