import { filter, map, mapValues } from "lodash";

import { Compiler } from "./compiler";
import { BoundColumn } from "./expressions";
import { OutputColumnTypes, Selectable, SelectableColumns } from "./selectables";
import { SqlType } from "./types";

export function table<TColumnTypes extends OutputColumnTypes>(name: string, columnDefinitions: ColumnDefinitions<TColumnTypes>) {
    return new Table(name, columnDefinitions);
}

type ColumnDefinitions<TColumnTypes extends OutputColumnTypes> = {[Property in keyof TColumnTypes]: TableColumnDefinition<TColumnTypes[Property]>};

class Table<TColumnTypes extends OutputColumnTypes> implements Selectable<TColumnTypes> {
    public readonly name: string;
    public readonly columnDefinitions: ColumnDefinitions<TColumnTypes>;
    public readonly c: SelectableColumns<TColumnTypes>;

    constructor(name: string, columnDefinitions: ColumnDefinitions<TColumnTypes>) {
        this.name = name;
        this.columnDefinitions = columnDefinitions;
        // TODO: remove cast
        this.c = mapValues(columnDefinitions, column => {
            return new BoundColumn({
                ...column._,
                selectable: this,
                sqlType: column._.type,
            });
        }) as SelectableColumns<TColumnTypes>;
    }

    get primaryKey() {
        const columns = filter(this.c, column => column.primaryKey);
        if (columns.length === 0) {
            return null;
        } else {
            return {columns};
        }
    }

    as(alias: string): AliasedTable<TColumnTypes> {
        return new AliasedTable(this, alias);
    }

    compileReference(): string {
        return this.name;
    }

    compileSelectable(compiler: Compiler): string {
        return this.name;
    }
}

class AliasedTable<TColumnTypes extends OutputColumnTypes> implements Selectable<TColumnTypes> {
    private readonly _table: Table<TColumnTypes>;
    private readonly _alias: string;
    public readonly c: SelectableColumns<TColumnTypes>;

    constructor(table: Table<TColumnTypes>, alias: string) {
        this._table = table;
        this._alias = alias;
        // TODO: remove cast
        this.c = mapValues(table.columnDefinitions, column => new BoundColumn({
            ...column._,
            selectable: this,
            sqlType: column._.type,
        })) as SelectableColumns<TColumnTypes>;
    }

    compileReference(): string {
        return this._alias;
    }

    compileSelectable(compiler: Compiler): string {
        return this._table.compileSelectable(compiler) + " AS " + this._alias;
    }
}

export function column<SqlType>(options: Partial<TableColumnDefinitionOptions<SqlType>> & Pick<TableColumnDefinitionOptions<SqlType>, "name" | "type">) {
    return new TableColumnDefinition({
        nullable: false,
        primaryKey: false,
        ...options
    });
}

interface TableColumnDefinitionOptions<SqlType> {
    name: string;
    nullable: boolean;
    primaryKey: boolean;
    type: SqlType;
}

export class TableColumnDefinition<SqlType> {
    public readonly _: TableColumnDefinitionOptions<SqlType>;

    constructor(options: TableColumnDefinitionOptions<SqlType>) {
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

export function createTable(table: Table<OutputColumnTypes>) {
    return new CreateTable(table);
}

class CreateTable {
    private readonly _table: Table<OutputColumnTypes>;

    constructor(table: Table<OutputColumnTypes>) {
        this._table = table;
    }

    compile(compiler: Compiler): string {
        const columns = map(this._table.columnDefinitions, column => column.compileCreate(compiler)).join(", ");
        return "CREATE TABLE " + this._table.name + " (" + columns + ")";
    }
}
