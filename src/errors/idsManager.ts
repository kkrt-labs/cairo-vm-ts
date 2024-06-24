import { HintReference, OffsetValue } from 'hints/hintReference';
import { Register } from 'vm/instruction';

class IdsManagerError extends Error {}

export class UndefinedImmediateRef extends IdsManagerError {
  constructor(reference: HintReference) {
    super(`Undefined immediate reference: ${reference}`);
  }
}

export class InvalidValueType extends IdsManagerError {
  constructor(reference: HintReference, offset: OffsetValue) {
    super(`Invalid value type on ${offset} for reference ${reference}`);
  }
}

export class InvalidRegister extends IdsManagerError {
  constructor(offset: OffsetValue, register: Register | undefined) {
    super(`Invalid register ${register} at offset ${offset}`);
  }
}

export class UndefinedValue extends IdsManagerError {
  constructor(offset: OffsetValue) {
    super(`Undefined value at offset ${offset}`);
  }
}

export class UndefinedVariable extends IdsManagerError {
  constructor(name: string) {
    super(`Variable ${name} is not available as reference of the hint`);
  }
}

export class ApTrackingDataGroupDifferHintRef extends IdsManagerError {
  constructor(hintApTrackingData: number, refApTrackingData: number) {
    super(
      `The ApTracking group of the hint and the reference differ:
  - hint: ${hintApTrackingData}
  - reference: ${refApTrackingData}`
    );
  }
}
