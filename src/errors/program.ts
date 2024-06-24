class ProgramError extends Error {}

export class UnknownIdentifier extends ProgramError {
  constructor(destination: string) {
    super(`Unknown identifier ${destination}`);
  }
}

export class InvalidIdentifierDest extends ProgramError {
  constructor(dest: string | undefined) {
    super(`Destination is invalid: ${dest}`);
  }
}
