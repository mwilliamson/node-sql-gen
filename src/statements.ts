import type { Compiler } from "./compiler";

export interface Statement {
    compile: (compiler: Compiler) => string;
}
