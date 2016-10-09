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
    
    compile(compiler) {
        const froms = " FROM " + this._.selectable.compileSelectable(compiler) + this._compileJoins(compiler);
        let sql = "SELECT ";
        
        if (this._.distinct) {
            sql += "DISTINCT ";
        }
        
        return sql + this._compileColumns(compiler) + froms;
    }
    
    _compileColumns(compiler) {
        return this._.columns.map(column => column.compileColumn(compiler)).join(", ");
    }
    
    _compileJoins(compiler) {
        return this._.joins.map(join => this._compileJoin(join, compiler)).join(" ");
    }
    
    _compileJoin(join, compiler) {
        return " JOIN " + join.selectable.compileSelectable(compiler) + " ON " + join.condition.compileExpression(compiler);
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
    
    compileReference(compiler) {
        return "anon_" + compiler.getAnonymousId(this._id);
    }
    
    compileSelectable(compiler) {
        const selectableId = compiler.addAnonymousId(this._id);
        // TODO: handle subquery used multiple times in same query
        return "(" + this._query.compile(compiler) + ") AS anon_" + selectableId;
    }
}
