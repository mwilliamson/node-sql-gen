export interface SqlType {
    name: string;
}

const int: SqlType = {name: "INTEGER"};
const string: SqlType = {name: "VARCHAR"};

const types = {
    int: int,
    string: string,
};

export default types;
