class ProgramError extends Error {}

export class InvalidIdentifierDest extends ProgramError {
  constructor(dest: string | undefined) {
    super(`Destination is invalid: ${dest}`);
  }
}
