import { fromPairs, map, mapValues } from "lodash";

import { Compiler } from "./compiler";
import { BoundColumn, Expression, toExpression } from "./expressions";
import type { Selectable } from "./selectables";

interface QueryOptions {
    columns: {[name: string]: Expression};
    conditions: Array<Expression>;
    distinct: boolean;
    joins: Array<Join>;
    selectable: Selectable;
}

interface Join {
    condition: Expression;
    selectable: Selectable;
}

export default class Query {
    private readonly _: QueryOptions;

    constructor(options: Partial<QueryOptions> & Pick<QueryOptions, "selectable">) {
        this._ = {
            columns: {},
            conditions: [],
            distinct: false,
            joins: [],
            ...options
        };
    }

    _copy(options: Partial<QueryOptions>) {
        return new Query({
            ...this._,
            ...options
        });
    }

    join(selectable: Selectable, condition: Expression) {
        const join = {selectable, condition};
        return this._copy({
            joins: this._.joins.concat([join])
        });
    }

    // TODO: tighten types
    select(columns: {[name: string]: unknown}) {
        return this._copy({columns: mapValues(columns, toExpression)});
    }

    distinct() {
        return this._copy({distinct: true});
    }

    where(condition: Expression) {
        return this._copy({
            conditions: this._.conditions.concat(condition)
        });
    }

    subquery() {
        return new SubQuery(this, Object.keys(this._.columns));
    }

    compile(compiler: Compiler) {
        let sql = "SELECT ";
        if (this._.distinct) {
            sql += "DISTINCT ";
        }
        sql += this._compileColumns(compiler);

        sql += " FROM " + this._.selectable.compileSelectable(compiler) + this._compileJoins(compiler);

        sql += this._compileWhere(compiler);

        return sql;
    }

    _compileColumns(compiler: Compiler) {
        return map(this._.columns, (expression, alias) => expression.compileExpression(compiler) + " AS " + alias).join(", ");
    }

    _compileJoins(compiler: Compiler) {
        return this._.joins.map(join => this._compileJoin(join, compiler)).join(" ");
    }

    _compileJoin(join: Join, compiler: Compiler) {
        return " JOIN " + join.selectable.compileSelectable(compiler) + " ON " + join.condition.compileExpression(compiler);
    }

    _compileWhere(compiler: Compiler) {
        if (this._.conditions.length === 0) {
            return "";
        } else {
            return " WHERE " + this._.conditions.map(condition => condition.compileExpression(compiler)).join(" AND ");
        }
    }
}

let subQueryId = 0;

class SubQuery implements Selectable {
    private readonly _id: number;
    private readonly _query: Query;
    public readonly c: {[name: string]: BoundColumn};

    constructor(query: Query, columns: Array<string>) {
        this._id = subQueryId++;
        this._query = query;
        this.c = fromPairs(columns.map(column => [
            column,
            new BoundColumn({
                selectable: this,
                name: column,
                primaryKey: false,
            })
        ]));
    }

    compileReference(compiler: Compiler): string {
        return "anon_" + compiler.getAnonymousId(this._id);
    }

    compileSelectable(compiler: Compiler): string {
        const selectableId = compiler.getAnonymousId(this._id);
        // TODO: handle subquery used multiple times in same query
        return "(" + this._query.compile(compiler) + ") AS anon_" + selectableId;
    }
}
