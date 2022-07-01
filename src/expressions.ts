import type {Compiler} from "./compiler";
import type {Selectable} from "./selectables";

export abstract class Expression {
    abstract compileExpression(compiler: Compiler): string;
}

interface BoundColumnOptions {
    name: string;
    primaryKey: boolean;
    selectable: Selectable;
}

export class BoundColumn extends Expression {
    private readonly _: BoundColumnOptions;

    constructor(options: BoundColumnOptions) {
        super();
        this._ = options;
    }

    get name(): string {
        return this._.name;
    }

    get primaryKey(): boolean {
        return this._.primaryKey;
    }

    _copy(options: Partial<BoundColumnOptions>): BoundColumn {
        return new BoundColumn({
            ...this._,
            ...options
        });
    }

    compileExpression(compiler: Compiler): string {
        return this._.selectable.compileReference(compiler) + "." + this._.name;
    }
}

export function eq(left: unknown, right: unknown) {
    return new BinaryOperation("=", left, right);
}

class BinaryOperation extends Expression {
    private readonly _operator: string;
    private readonly _left: Expression;
    private readonly _right: Expression;

    // TODO: tighter typing of left and right
    constructor(operator: string, left: unknown, right: unknown) {
        super();
        this._operator = operator;
        this._left = toExpression(left);
        this._right = toExpression(right);
    }

    compileExpression(compiler: Compiler): string {
        return this._left.compileExpression(compiler) + " " + this._operator + " " + this._right.compileExpression(compiler);
    }
}

export function boundParameter(options: BoundParameterOptions) {
    return new BoundParameter(options);
}

interface BoundParameterOptions {
    value: unknown;
}

class BoundParameter extends Expression {
    private readonly _: BoundParameterOptions;

    constructor(options: BoundParameterOptions) {
        super();
        this._ = options;
    }

    compileExpression(compiler: Compiler) {
        compiler.addParam(this._.value);
        return "?";
    }
}

export function toExpression(value: unknown): Expression {
    if (value === undefined) {
        throw new Error("expression cannot be undefined");
    } else if (value instanceof Expression) {
        return value;
    } else {
        return boundParameter({value});
    }
}
