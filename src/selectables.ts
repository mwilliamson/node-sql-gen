import { Compiler } from "./compiler";
import { BoundColumn } from "./expressions";
import { SqlType } from "./types";

export type OutputColumnTypes = {[name: string]: SqlType};

export type SelectableColumns<TColumnTypes extends OutputColumnTypes> = {[Property in keyof TColumnTypes]: BoundColumn<TColumnTypes[Property]>};

export interface Selectable<TColumnTypes extends OutputColumnTypes> {
    c: SelectableColumns<TColumnTypes>;
    compileReference: (compiler: Compiler) => string;
    compileSelectable: (compiler: Compiler) => string;
}
