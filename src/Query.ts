import { map, mapValues } from "lodash";

import { Compiler } from "./compiler";
import { BoundColumn, Expression } from "./expressions";
import type { OutputColumnTypes, Selectable, SelectableColumns } from "./selectables";

interface QueryOptions<TColumnTypes extends OutputColumnTypes> {
    columns: {[Property in keyof TColumnTypes]: Expression<TColumnTypes[Property]>};
    // TODO: alias boolean sql type
    conditions: Array<Expression<"BOOLEAN">>;
    distinct: boolean;
    joins: Array<Join>;
    selectable: Selectable<OutputColumnTypes>;
}

interface Join {
    condition: Expression<"BOOLEAN">;
    selectable: Selectable<OutputColumnTypes>;
}

export default class Query<TColumnTypes extends OutputColumnTypes> {
    private readonly _: QueryOptions<TColumnTypes>;

    constructor(options: Partial<QueryOptions<TColumnTypes>> & Pick<QueryOptions<TColumnTypes>, "columns" | "selectable">) {
        this._ = {
            conditions: [],
            distinct: false,
            joins: [],
            ...options
        };
    }

    _copy(options: Partial<QueryOptions<TColumnTypes>>) {
        return new Query({
            ...this._,
            ...options
        });
    }

    join(selectable: Selectable<TColumnTypes>, condition: Expression<"BOOLEAN">) {
        const join = {selectable, condition};
        return this._copy({
            joins: this._.joins.concat([join])
        });
    }

    // TODO: tighten types
    select<TNewColumnTypes extends OutputColumnTypes>(columns: {[Property in keyof TNewColumnTypes]: Expression<TNewColumnTypes[Property]>}) {
        return new Query<TNewColumnTypes>({
            ...this._,
            columns: columns
        });
    }

    distinct() {
        return this._copy({distinct: true});
    }

    where(condition: Expression<"BOOLEAN">) {
        return this._copy({
            conditions: this._.conditions.concat(condition)
        });
    }

    subquery(): SubQuery<TColumnTypes> {
        return new SubQuery(this, this._.columns);
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

class SubQuery<TColumnTypes extends OutputColumnTypes> implements Selectable<TColumnTypes> {
    private readonly _id: number;
    private readonly _query: Query<TColumnTypes>;
    public readonly c: SelectableColumns<TColumnTypes>;

    constructor(query: Query<TColumnTypes>, columns: {[Property in keyof TColumnTypes]: Expression<TColumnTypes[Property]>}) {
        this._id = subQueryId++;
        this._query = query;
        // TODO: remove cast
        this.c = mapValues(columns, (column, name) => new BoundColumn({
            selectable: this,
            name: name,
            primaryKey: false,
            sqlType: column.sqlType
        })) as SelectableColumns<TColumnTypes>;
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
