export const ErrorType = {
  FeltError: 'FeltError',
  RelocatableError: 'RelocatableError',
  Int16Error: 'Int16Error',
  UintError: 'UintError',
  MemoryError: 'MemoryError',
  VMError: 'VMError',
  InstructionError: 'InstructionError',
  RunContextError: 'RunContextError',
} as const;

export class BaseError extends Error {
  type: string;
  message: string;

  constructor(type: string, message: string) {
    super(message);
    this.type = type;
    this.message = message;
  }
}

export class UnknownError extends Error {
  constructor(cause: any) {
    super(cause);
    this.cause = cause;
  }
}
