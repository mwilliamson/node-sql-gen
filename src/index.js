import { mapValues } from "lodash";

import { BoundColumn, eq } from "./expressions";
import Query from "./Query";

export function table(name, columns) {
    return new Table(name, columns);
}

class Table {
    constructor(name, columns) {
        this.name = name;
        this.columns = columns;
        this.c = mapValues(columns, (column, propertyName) => new BoundColumn({
            selectable: this,
            columnName: column.name,
            alias: propertyName
        }));
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
            selectable: this,
            columnName: column.name
        }));
    }
    
    compileReference(options) {
        return this._alias;
    }
    
    compileSelectable(options) {
        return this._table.compileSelectable(options) + " AS " + this._alias;
    }
}

export function column(options) {
    return new Column(options);
}

class Column {
    constructor({name}) {
        this.name = name;
    }
}

export function from(selectable) {
    return new Query({selectable});
}

export function compile(query) {
    return query.compile({
        anonMap: {},
        anonCounter: [0]
    });
}

export default {
    table,
    column,
    from,
    eq,
    compile
}
