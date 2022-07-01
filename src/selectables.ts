import { Compiler } from "./compiler";

export interface Selectable {
    compileReference: (compiler: Compiler) => string;
    compileSelectable: (compiler: Compiler) => string;
}
