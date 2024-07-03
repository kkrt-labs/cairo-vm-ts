import { CellRef, Hint } from 'hints/hintSchema';

class HintError extends Error {}

export class InvalidCellRefRegister extends HintError {
  constructor(cell: CellRef) {
    super(`Invalid register, expected AP or FP, got ${cell}`);
  }
}

export class InvalidOperation extends HintError {
  constructor(op: string) {
    super(`Invalid BinOp operator - Expected Add or Mul, received ${op}`);
  }
}

export class UnknownHint extends HintError {
  constructor(hint: Hint) {
    super(`Unknown hint: ${hint}`);
  }
}
