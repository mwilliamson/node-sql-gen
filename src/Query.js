import { fromPairs, mapValues } from "lodash";

import { BoundColumn } from "./expressions";

export default class Query {
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
        const join = {selectable, condition};
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
        const froms = " FROM " + this._.selectable.compileSelectable(options) + this._compileJoins(options);
        let sql = "SELECT ";
        
        if (this._.distinct) {
            sql += "DISTINCT ";
        }
        
        return sql + this._compileColumns(options) + froms;
    }
    
    _compileColumns(options) {
        return this._.columns.map(column => column.compileColumn(options)).join(", ");
    }
    
    _compileJoins(options) {
        return this._.joins.map(join => this._compileJoin(join, options)).join(" ");
    }
    
    _compileJoin(join, options) {
        return " JOIN " + join.selectable.compileSelectable(options) + " ON " + join.condition.compileExpression(options);
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
    
    compileSelectable(options) {
        const selectableId = options.anonCounter[0]++;
        // TODO: handle subquery used multiple times in same query
        options.anonMap[this._id] = selectableId;
        return "(" + this._query.compile(options) + ") AS anon_" + selectableId;
    }
}
