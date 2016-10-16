import { filter, map, mapValues } from "lodash";

import { BoundColumn, eq, boundParameter } from "./expressions";
import Query from "./Query";
import { Compiler, compile } from "./compiler";

export function table(name, columns) {
    return new Table(name, columns);
}

class Table {
    constructor(name, columns) {
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
        const columns = filter(this.c, column => column.primaryKey);
        if (columns.length === 0) {
            return null;
        } else {
            return {columns};
        }
    }
    
    as(alias) {
        return new AliasedTable(this, alias);
    }
    
    compileReference() {
        return this.name;
    }
    
    compileSelectable() {
        return this.name;
    }
}

class AliasedTable {
    constructor(table, alias) {
        this._table = table;
        this._alias = alias;
        this.c = mapValues(table.columns, column => new BoundColumn({
            ...column._,
            selectable: this
        }));
    }
    
    compileReference() {
        return this._alias;
    }
    
    compileSelectable(compiler) {
        return this._table.compileSelectable(compiler) + " AS " + this._alias;
    }
}

export function column(options) {
    return new Column(options);
}

class Column {
    constructor(options) {
        this._ = options;
    }
    
    compileCreate(compiler) {
        let sql = this._.name + " " + this._.type;
        
        if (this._.primaryKey) {
            sql += " PRIMARY KEY";
        }
        
        if (this._.nullable !== undefined && !this._.nullable) {
            sql += " NOT NULL";
        }
        
        return sql;
    }
}

export function from(selectable) {
    return new Query({selectable});
}

export const types = {
    int: "INTEGER",
    string: "VARCHAR"
};

export function createTable(table) {
    return new CreateTable(table);
}

class CreateTable {
    constructor(table) {
        this._table = table;
    }
    
    compile(compiler) {
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
