/** Errors related to Instruction methods */
export class InstructionError extends Error {}

/** High bit is not zero */
export class HighBitSetError extends InstructionError {}

/** Invalid dst register */
export class InvalidDstRegister extends InstructionError {}

/** Invalid op0 register */
export class InvalidOp0Register extends InstructionError {}

/** Invalid op1 Source */
export class InvalidOp1Register extends InstructionError {}

/** Invalid PC Update */
export class InvalidPcUpdate extends InstructionError {}

/** Invalid AP Update */
export class InvalidApUpdate extends InstructionError {}

/** Invalid Result Logic */
export class InvalidResLogic extends InstructionError {}

/** Invalid Opcode */
export class InvalidOpcode extends InstructionError {}
