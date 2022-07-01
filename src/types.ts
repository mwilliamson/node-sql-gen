export type SqlType = "BOOLEAN" | "INTEGER" | "VARCHAR";

const types = {
    boolean: "BOOLEAN" as const,
    int: "INTEGER" as const,
    string: "VARCHAR" as const,
};

export default types;
