export class BoundColumn {
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
    
    compileExpression(compiler) {
        return this._.selectable.compileReference(compiler) + "." + this._.columnName;
    }
    
    compileColumn(compiler) {
        let sql = this.compileExpression(compiler);
        if (this._.alias && this._.alias !== this._.columnName) {
            sql += " AS " + this._.alias;
        }
        return sql;
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
