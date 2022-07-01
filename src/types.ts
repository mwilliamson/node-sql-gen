export interface SqlType<T> {
    name: string;
}

const int: SqlType<number> = {name: "INTEGER"};
const string: SqlType<string> = {name: "VARCHAR"};

const types = {
    int: int,
    string: string,
};

export default types;
