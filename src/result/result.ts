import { BaseError } from './error';

type Ok<T> = { value: T; error: undefined };
export type Err = { value: undefined; error: BaseError };

export type Result<T> = Ok<T> | Err;
