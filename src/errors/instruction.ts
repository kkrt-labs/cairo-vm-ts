/** Errors related to Instruction methods */
class InstructionError extends Error {}

/** High bit is not zero */
export class HighBitSetError extends InstructionError {
  constructor(encodedInstruction: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(16)} - High bit is not zero`
    );
  }
}

/** Invalid dst register */
export class InvalidDstRegister extends InstructionError {
  constructor(encodedInstruction: bigint, flag: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(
        16
      )} - Invalid dst register: dst flag = ${flag}`
    );
  }
}

/** Invalid op0 register */
export class InvalidOp0Register extends InstructionError {
  constructor(encodedInstruction: bigint, flag: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(
        16
      )} - Invalid op0 register: op0 flag = ${flag}`
    );
  }
}

/** Invalid op1 Source */
export class InvalidOp1Register extends InstructionError {
  constructor(encodedInstruction: bigint, flag: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(
        16
      )} - Invalid op1 register: op1 flag = ${flag}`
    );
  }
}

/** Invalid PC Update */
export class InvalidPcUpdate extends InstructionError {
  constructor(encodedInstruction: bigint, flag: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(
        16
      )} - Invalid PC update: pcUpdate flag = ${flag}`
    );
  }
}

/** Invalid AP Update */
export class InvalidApUpdate extends InstructionError {
  constructor(encodedInstruction: bigint, flag: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(
        16
      )} - Invalid AP update: apUpdate flag = ${flag}`
    );
  }
}

/** Invalid Result Logic */
export class InvalidResLogic extends InstructionError {
  constructor(encodedInstruction: bigint, flag: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(
        16
      )} - Invalid res logic: resLogic flag = ${flag}`
    );
  }
}

/** Invalid Opcode */
export class InvalidOpcode extends InstructionError {
  constructor(encodedInstruction: bigint, flag: bigint) {
    super(
      `Instruction 0x${encodedInstruction.toString(
        16
      )} - Invalid opcode: opcode flag = ${flag}`
    );
  }
}
