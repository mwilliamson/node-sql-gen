import { filter, map, mapValues } from "lodash";

import { BoundColumn, eq, Expression, boundParameter } from "./expressions";
import Query from "./Query";
import { Compiler, compile } from "./compiler";

export function table(name: string, columnDefinitions: {[name: string]: TableColumnDefinition}) {
    return new Table(name, columnDefinitions);
}

export interface Selectable {
    compileReference: (compiler: Compiler) => string;
    compileSelectable: (compiler: Compiler) => string;
}

class Table implements Selectable {
    public readonly name: string;
    public readonly columnDefinitions: {[name: string]: TableColumnDefinition};
    public readonly c: {[name: string]: BoundColumn}

    constructor(name: string, columnDefinitions: {[name: string]: TableColumnDefinition}) {
        this.name = name;
        this.columnDefinitions = columnDefinitions;
        this.c = mapValues(columnDefinitions, column => {
            return new BoundColumn({
                ...column._,
                selectable: this
            });
        });
    }

    get primaryKey() {
        const columns = filter(this.c, column => column.primaryKey);
        if (columns.length === 0) {
            return null;
        } else {
            return {columns};
        }
    }

    as(alias: string): AliasedTable {
        return new AliasedTable(this, alias);
    }

    compileReference(): string {
        return this.name;
    }

    compileSelectable(compiler: Compiler): string {
        return this.name;
    }
}

class AliasedTable implements Selectable {
    private readonly _table: Table;
    private readonly _alias: string;
    public readonly c: {[name: string]: Expression}

    constructor(table: Table, alias: string) {
        this._table = table;
        this._alias = alias;
        this.c = mapValues(table.columnDefinitions, column => new BoundColumn({
            ...column._,
            selectable: this
        }));
    }

    compileReference(): string {
        return this._alias;
    }

    compileSelectable(compiler: Compiler): string {
        return this._table.compileSelectable(compiler) + " AS " + this._alias;
    }
}

export function column(options: Partial<TableColumnDefinitionOptions> & Pick<TableColumnDefinitionOptions, "name">) {
    return new TableColumnDefinition({
        nullable: false,
        primaryKey: false,
        type: "int",
        ...options
    });
}

interface TableColumnDefinitionOptions {
    name: string;
    nullable: boolean;
    primaryKey: boolean;
    type: string;
}

export class TableColumnDefinition {
    public readonly _: TableColumnDefinitionOptions;

    constructor(options: TableColumnDefinitionOptions) {
        this._ = options;
    }

    compileCreate(compiler: Compiler): string {
        let sql = this._.name + " " + this._.type;

        if (this._.primaryKey) {
            sql += " PRIMARY KEY";
        }

        if (!this._.nullable && !this._.primaryKey) {
            sql += " NOT NULL";
        }

        return sql;
    }
}

export function from(selectable: Selectable) {
    return new Query({selectable});
}

export const types = {
    int: "INTEGER",
    string: "VARCHAR"
};

export function createTable(table: Table) {
    return new CreateTable(table);
}

class CreateTable {
    private readonly _table: Table;

    constructor(table: Table) {
        this._table = table;
    }

    compile(compiler: Compiler): string {
        const columns = map(this._table.columnDefinitions, column => column.compileCreate(compiler)).join(", ");
        return "CREATE TABLE " + this._table.name + " (" + columns + ")";
    }
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
