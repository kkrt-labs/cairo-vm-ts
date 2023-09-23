type ErrorData = {
  message: string;
};

type Success<T> = {
  success: true;
  value: T;
};

type Err<E extends ErrorData> = {
  success: false;
  value: E;
};

export class UnwrapError extends Error {}

export class Result<T, E extends ErrorData> {
  private value: Success<T> | Err<E>;

  private constructor(value: Success<T> | Err<E>) {
    this.value = value;
  }

  static ok<T>(value: T): Result<T, never> {
    const res: Success<T> = {
      success: true,
      value,
    };
    return new Result<T, never>(res);
  }

  static error<E extends ErrorData>(value: E): Result<never, E> {
    const res: Err<E> = {
      success: false,
      value,
    };
    return new Result<never, E>(res);
  }

  isOk(): this is Result<T, never> {
    return this.value.success === true;
  }

  isErr(): this is Result<never, E> {
    return this.value.success === false;
  }

  unwrapOrUndefined(): T | undefined {
    if (this.isOk()) {
      return this.value.value;
    }
    return undefined;
  }

  unwrapErrOrUndefined(): E | undefined {
    if (this.isErr()) {
      return this.value.value;
    }
    return undefined;
  }

  unwrap(): T {
    if (this.isOk()) {
      return this.value.value;
    }
    throw new UnwrapError();
  }

  unwrapErr(): E {
    if (this.isErr()) {
      return this.value.value;
    }
    throw new UnwrapError();
  }
}
