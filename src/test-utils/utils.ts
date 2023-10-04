import { Result, VMError } from 'result-pattern/result';

export function unwrapOk<T, E extends VMError>(result: Result<T, E>): T {
  if (result.isErr()) {
    throw new Error(result.unwrapErr().message);
  }
  return result.unwrap();
}

export function unwrapErr<T, E extends VMError>(result: Result<T, E>): E {
  if (result.isErr()) {
    return result.unwrapErr();
  }
  throw new Error('Expected error, but got Ok');
}
