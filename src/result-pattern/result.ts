export type VMError = {
  message: string;
};

type Success<T> = {
  success: true;
  value: T;
};

type TErr<E extends VMError> = {
  success: false;
  value: E;
};

export class UnwrapError extends Error {}

export class Ok<T> {
  private value: Success<T>;
  constructor(value: T) {
    this.value = {
      success: true,
      value,
    };
  }
  isOk(): this is Ok<T> {
    return true;
  }
  isErr(): this is never {
    return false;
  }
  unwrap(): T {
    return this.value.value;
  }
}

export class Err<E extends VMError> {
  private value: TErr<E>;
  constructor(value: E) {
    this.value = {
      success: false,
      value,
    };
  }
  isOk(): this is never {
    return false;
  }
  isErr(): this is Err<E> {
    return true;
  }
  unwrapErr(): E {
    return this.value.value;
  }

  static composeErrors(errors: VMError[]): VMError {
    const message = errors.reduce((acc, err) => acc + err.message + ' \n ', '');
    return {
      message,
    };
  }
}

export type Result<T, E extends VMError> = Ok<T> | Err<E>;
