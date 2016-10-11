export class Compiler {
    constructor() {
        this._anonymousMap = {};
        this._anonymousCounter = 0;
        this.params = [];
    }
    
    addParam(value) {
        this.params.push(value);
    }
    
    getAnonymousId(elementId) {
        if (this._anonymousMap[elementId] === undefined) {
            const anonymousId = this._anonymousCounter++;
            this._anonymousMap[elementId] = anonymousId;
        }
        return this._anonymousMap[elementId];
    }
}

export function compile(query) {
    const compiler = new Compiler();
    const text = query.compile(compiler);
    return {text, params: compiler.params};
}
