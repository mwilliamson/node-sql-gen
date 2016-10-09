class Expression {
    as(alias) {
        return new AliasedColumn(this, alias);
    }
    
    compileColumn(compiler) {
        return this.compileExpression(compiler);
    }
}

export class BoundColumn extends Expression {
    constructor(options) {
        super();
        this._ = options;
    }
    
    _copy(options) {
        return new BoundColumn({
            ...this._,
            ...options
        });
    }
    
    key() {
        return this._.columnName;
    }
    
    compileExpression(compiler) {
        return this._.selectable.compileReference(compiler) + "." + this._.columnName;
    }
    
    compileColumn(compiler) {
        return this.compileExpression(compiler);
    }
}

// TODO: override as()
class AliasedColumn extends Expression {
    constructor(expression, alias) {
        super();
        this._expression = expression;
        this._alias = alias;
    }
    
    key() {
        return this._alias;
    }
    
    compileExpression(compiler) {
        return this._expression.compileExpression(compiler);
    }
    
    compileColumn(compiler) {
        return this.compileExpression(compiler) + " AS " + this._alias;
    }
}

export function eq(left, right) {
    return new BinaryOperation("=", left, right);
}

class BinaryOperation extends Expression {
    constructor(operator, left, right) {
        super();
        this._operator = operator;
        this._left = left;
        this._right = right;
    }
    
    compileExpression(compiler) {
        return this._left.compileExpression(compiler) + " " + this._operator + " " + this._right.compileExpression(compiler);
    }
}

export function boundParameter(options) {
    return new BoundParameter(options);
}

class BoundParameter extends Expression {
    constructor(options) {
        super();
        this._ = options;
    }
    
    compileExpression(compiler) {
        compiler.addParam(this._.value);
        return "?";
    }
}

export function toColumn(value) {
    if (value instanceof Expression) {
        return value;
    } else {
        return boundParameter({value});
    }
}
