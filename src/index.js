import { mapValues } from "lodash";

export function table(name, columns) {
    return new Table(name, columns);
}

class Table {
    constructor(name, columns) {
        this.name = name;
        this.columns = columns;
        this.c = mapValues(columns, column => new BoundColumn({selectable: this, column}));
    }
    
    as(alias) {
        return new AliasedTable(this, alias);
    }
}

class AliasedTable {
    constructor(table, alias) {
        this._table = table;
        this.name = alias;
        this.c = mapValues(table.columns, column => new BoundColumn({
            selectable: this,
            column: column
        }));
    }
    
    compile() {
        return toSelectable(this._table).compile() + " AS " + this.name;
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
    constructor(options) {
        this._ = options;
    }
    
    _copy(options) {
        return new BoundColumn({
            ...this._,
            ...options
        });
    }
    
    as(alias) {
        return this._copy({alias});
    }
    
    compile() {
        let sql = this._.selectable.name + "." + this._.column.name;
        if (this._.alias) {
            sql += " AS " + this._.alias;
        }
        return sql;
    }
}

export function from(selectable) {
    return new Query({selectable: toSelectable(selectable)});
}

function toSelectable(selectable) {
    if (selectable instanceof Table) {
        return new FromClause(selectable);
    } else {
        return selectable;
    }
}

class FromClause {
    constructor(selectable) {
        this._selectable = selectable;
    }
    
    compile() {
        return this._selectable.name;
    }
}

export function eq(left, right) {
    return new BinaryOperation("=", left, right);
}

class BinaryOperation {
    constructor(operator, left, right) {
        this._operator = operator;
        this._left = left;
        this._right = right;
    }
    
    compile() {
        return this._left.compile() + " " + this._operator + " " + this._right.compile();
    }
}

class Query {
    constructor({...options}) {
        this._ = options;
        this._.joins = this._.joins || [];
    }
    
    _copy(options) {
        return new Query({
            ...this._,
            ...options
        });
    }
    
    join(selectable, condition) {
        const join = {
            selectable: toSelectable(selectable),
            condition
        };
        return this._copy({
            joins: this._.joins.concat([join])
        });
    }
    
    select(...columns) {
        return this._copy({columns: columns});
    }
    
    compile() {
        return "SELECT " + this._compileColumns() + " FROM " + this._.selectable.compile() + this._compileJoins();
    }
    
    _compileColumns() {
        return this._.columns.map(column => column.compile()).join(", ");
    }
    
    _compileJoins() {
        return this._.joins.map(join => this._compileJoin(join)).join(" ");
    }
    
    _compileJoin(join) {
        return " JOIN " + join.selectable.compile() + " ON " + join.condition.compile();
    }
}

export function compile(query) {
    return query.compile();
}

export default {
    table,
    column,
    from,
    eq,
    compile
}
