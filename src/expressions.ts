import type {Compiler} from "./compiler";
import type {OutputColumnTypes, Selectable} from "./selectables";
import { SqlType } from "./types";

export abstract class Expression<T = SqlType> {
    public readonly sqlType: T;

    constructor(sqlType: T) {
        this.sqlType = sqlType;
    }

    abstract compileExpression(compiler: Compiler): string;
}

interface BoundColumnOptions<T> {
    name: string;
    primaryKey: boolean;
    selectable: Selectable<OutputColumnTypes>;
    sqlType: T;
}

export class BoundColumn<T> extends Expression<T> {
    private readonly _: BoundColumnOptions<T>;

    constructor(options: BoundColumnOptions<T>) {
        super(options.sqlType);
        this._ = options;
    }

    get name(): string {
        return this._.name;
    }

    get primaryKey(): boolean {
        return this._.primaryKey;
    }

    _copy(options: Partial<BoundColumnOptions<T>>): BoundColumn<T> {
        return new BoundColumn({
            ...this._,
            ...options
        });
    }

    compileExpression(compiler: Compiler): string {
        return this._.selectable.compileReference(compiler) + "." + this._.name;
    }
}

export function eq(left: Expression, right: Expression): Expression<"BOOLEAN"> {
    return new BinaryOperation("BOOLEAN", "=", left, right);
}

class BinaryOperation<T> extends Expression<T> {
    private readonly _operator: string;
    private readonly _left: Expression;
    private readonly _right: Expression;

    constructor(sqlType: T, operator: string, left: Expression, right: Expression) {
        super(sqlType);
        this._operator = operator;
        this._left = left;
        this._right = right;
    }

    compileExpression(compiler: Compiler): string {
        return this._left.compileExpression(compiler) + " " + this._operator + " " + this._right.compileExpression(compiler);
    }
}

export function boundParameter<T>(options: BoundParameterOptions<T>) {
    return new BoundParameter(options);
}

interface BoundParameterOptions<T> {
    sqlType: T;
    value: unknown;
}

class BoundParameter<T> extends Expression<T> {
    private readonly _: BoundParameterOptions<T>;

    constructor(options: BoundParameterOptions<T>) {
        super(options.sqlType);
        this._ = options;
    }

    compileExpression(compiler: Compiler) {
        compiler.addParam(this._.value);
        return "?";
    }
}
