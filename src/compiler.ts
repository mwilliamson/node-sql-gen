import type { Statement } from "./statements";

export class Compiler {
    private readonly _anonymousMap: {[elementId: number]: number};
    private _anonymousCounter: number;
    public params: Array<unknown>;

    constructor() {
        this._anonymousMap = {};
        this._anonymousCounter = 0;
        this.params = [];
    }

    addParam(value: unknown) {
        this.params.push(value);
    }

    getAnonymousId(elementId: number): number {
        if (this._anonymousMap[elementId] === undefined) {
            const anonymousId = this._anonymousCounter++;
            this._anonymousMap[elementId] = anonymousId;
        }
        return this._anonymousMap[elementId];
    }
}

export function compile(statement: Statement) {
    const compiler = new Compiler();
    const text = statement.compile(compiler);
    return {text, params: compiler.params};
}
