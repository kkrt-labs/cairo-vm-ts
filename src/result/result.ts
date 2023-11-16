export type Ok<T> = { value: T; error: undefined };
export type Err = { value: undefined; error: Error };

export type Result<T> = Ok<T> | Err;
