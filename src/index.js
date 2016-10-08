import { mapValues } from "lodash";

export function table(name, columns) {
    return new Table(name, columns);
}

class Table {
    constructor(name, columns) {
        this.name = name;
        this.c = mapValues(columns, column => new BoundColumn(this, column));
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

class BoundColumn {
    constructor(table, column) {
        this._table = table;
        this._column = column;
    }
    
    compile() {
        return this._table.name + "." + this._column.name;
    }
}

export function from(selectable) {
    return new Query({selectable: new FromClause(selectable)});
}

class FromClause {
    constructor(selectable) {
        this._selectable = selectable;
    }
    
    compile() {
        return this._selectable.name;
    }
}

class Query {
    constructor(options) {
        this._ = options;
    }
    
    _copy(options) {
        return new Query({
            ...this._,
            ...options
        });
    }
    
    select(...columns) {
        return this._copy({columns: columns});
    }
    
    compile() {
        return "SELECT " + this._compileColumns() + " FROM " + this._.selectable.compile();
    }
    
    _compileColumns() {
        return this._.columns.map(column => column.compile()).join(", ");
    }
}

export function compile(query) {
    return query.compile();
}

export default {
    table,
    column,
    from,
    compile
}
