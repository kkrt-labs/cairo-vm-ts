import { Err, Ok } from 'result-pattern/result';

export class Some<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }
  isSome(): this is Some<T> {
    return true;
  }
  isNone(): this is never {
    return false;
  }
  unwrap(): T {
    return this.value;
  }
  ok(): Ok<T> {
    return new Ok(this.value);
  }
}

export class NoneError extends Error {}

export class None {
  constructor() {}
  isSome(): this is never {
    return false;
  }
  isNone(): this is None {
    return true;
  }
  unwrap(): never {
    throw new NoneError('Attempted to unwrap a None value');
  }
  ok(): Err<NoneError> {
    return new Err(new NoneError('Option is none'));
  }
}

export type Option<T> = Some<T> | None;
