import { mapValues } from "lodash";

import { BoundColumn, eq, boundParameter } from "./expressions";
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
    constructor({name}) {
        this.name = name;
    }
}

export function from(selectable) {
    return new Query({selectable});
}

export function compile(query) {
    const compiler = new Compiler();
    const sql = query.compile(compiler);
    return {sql, params: compiler.params};
}

class Compiler {
    constructor() {
        this._anonymousMap = {};
        this._anonymousCounter = 0;
        this.params = [];
    }
    
    addParam(value) {
        this.params.push(value);
    }
    
    addAnonymousId(elementId) {
        const anonymousId = this._anonymousCounter++;
        this._anonymousMap[elementId] = anonymousId;
        return anonymousId;
    }
    
    getAnonymousId(elementId) {
        return this._anonymousMap[elementId];
    }
}

export default {
    table,
    column,
    from,
    eq,
    boundParameter,
    compile
}
