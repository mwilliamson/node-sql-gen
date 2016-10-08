import { fromPairs, mapValues } from "lodash";

export function table(name, columns) {
    return new Table(name, columns);
}

class Table {
    constructor(name, columns) {
        this.name = name;
        this.columns = columns;
        this.c = mapValues(columns, column => new BoundColumn({
            selectable: this,
            columnName: column.name
        }));
    }
    
    as(alias) {
        return new AliasedTable(this, alias);
    }
    
    compileReference() {
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
    
    compile(options) {
        return toSelectable(this._table).compile(options) + " AS " + this._alias;
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
    
    key() {
        return this._.alias || this._.columnName;
    }
    
    compile(options) {
        let sql = this._.selectable.compileReference(options) + "." + this._.columnName;
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
    
    compile(options) {
        return this._left.compile(options) + " " + this._operator + " " + this._right.compile(options);
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
    
    distinct() {
        return this._copy({distinct: true});
    }
    
    subquery() {
        return new SubQuery(this, this._.columns.map(column => column.key()));
    }
    
    compile(options) {
        const froms = " FROM " + this._.selectable.compile(options) + this._compileJoins(options);
        let sql = "SELECT ";
        
        if (this._.distinct) {
            sql += "DISTINCT ";
        }
        
        return sql + this._compileColumns(options) + froms;
    }
    
    _compileColumns(options) {
        return this._.columns.map(column => column.compile(options)).join(", ");
    }
    
    _compileJoins(options) {
        return this._.joins.map(join => this._compileJoin(join, options)).join(" ");
    }
    
    _compileJoin(join, options) {
        return " JOIN " + join.selectable.compile(options) + " ON " + join.condition.compile(options);
    }
}

let subQueryId = 0;

class SubQuery {
    constructor(query, columns) {
        this._id = subQueryId++;
        this._query = query;
        this.c = fromPairs(columns.map(column => [
            column,
            new BoundColumn({
                selectable: this,
                columnName: column
            })
        ]));
    }
    
    compileReference(options) {
        return "anon_" + options.anonMap[this._id];
    }
    
    compile(options) {
        const selectableId = options.anonCounter[0]++;
        // TODO: handle subquery used multiple times in same query
        options.anonMap[this._id] = selectableId;
        return "(" + this._query.compile(options) + ") AS anon_" + selectableId;
    }
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
