import { CellRef } from 'hints/hintParamsSchema';
import { Hint } from 'hints/hintSchema';

class HintError extends Error {}

/** The provided register at `cell` is incorrect. It must either be AP or FP. */
export class InvalidCellRefRegister extends HintError {
  constructor(cell: CellRef) {
    super(`Invalid register, expected AP or FP, got ${cell}`);
  }
}

/** The operator of the BinOp operation `op` must either be `Add` or `Mul`. */
export class InvalidOperation extends HintError {
  constructor(op: string) {
    super(`Invalid BinOp operator - Expected Add or Mul, received ${op}`);
  }
}

/** The hint to be executed is unknown. */
export class UnknownHint extends HintError {
  constructor(hint: Hint) {
    super(`Unknown hint: ${hint}`);
  }
}

/** The number of dict accesses is invalid. */
export class InvalidDictAccessesNumber extends HintError {
  constructor(ptrDiffValue: number, dictAccessSize: number) {
    super(
      `The number of dictionnary accesses (${ptrDiffValue}) must be a multiple of the dictionnary access size (${dictAccessSize})`
    );
  }
}
