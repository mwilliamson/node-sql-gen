class Expression {
    as(alias) {
        return new AliasedColumn(this, alias);
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

class AliasedColumn {
    constructor(expression, alias) {
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

class BinaryOperation {
    constructor(operator, left, right) {
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

class BoundParameter {
    constructor(options) {
        this._ = options;
    }
    
    compileColumn(compiler) {
        compiler.addParam(this._.value);
        return "?";
    }
}
