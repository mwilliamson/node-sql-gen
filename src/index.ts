import { filter, map, mapValues } from "lodash";

import { BoundColumn, eq, Expression, boundParameter } from "./expressions";
import Query from "./Query";
import { Compiler, compile } from "./compiler";

export function table(name: string, columns: {[name: string]: TableColumn}) {
    return new Table(name, columns);
}

export interface Selectable {
    compileReference: (compiler: Compiler) => string;
    compileSelectable: (compiler: Compiler) => string;
}

class Table implements Selectable {
    public readonly name: string;
    public readonly columns: {[name: string]: TableColumn};
    public readonly c: {[name: string]: Expression}

    constructor(name: string, columns: {[name: string]: TableColumn}) {
        this.name = name;
        this.columns = columns;
        this.c = mapValues(columns, (column, propertyName) => {
            const bound = new BoundColumn({
                ...column._,
                selectable: this
            });
            if (propertyName !== bound.key()) {
                return bound.as(propertyName);
            } else {
                return bound;
            }
        });
    }

    get primaryKey() {
        // TODO: remove cast
        const columns = filter(this.c, column => (column as BoundColumn).primaryKey);
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
        this.c = mapValues(table.columns, column => new BoundColumn({
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

export function column(options: Partial<TableColumnOptions> & Pick<TableColumnOptions, "name">) {
    return new TableColumn({
        nullable: false,
        primaryKey: false,
        type: "int",
        ...options
    });
}

interface TableColumnOptions {
    name: string;
    nullable: boolean;
    primaryKey: boolean;
    type: string;
}

export class TableColumn {
    public readonly _: TableColumnOptions;

    constructor(options: TableColumnOptions) {
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
        const columns = map(this._table.columns, column => column.compileCreate(compiler)).join(", ");
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
