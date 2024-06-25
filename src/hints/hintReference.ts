import { InvalidOffsetExpr, InvalidReference } from 'errors/hintReference';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { ApTrackingData, Reference } from 'vm/program';

/**
 * - `Immediate`: Should be read as a Felt (e.g. `42`)
 * - `Reference`: Should be read as a Relocatable,
 * can have an associated offset (e.g. `ap + 1`, `fp`)
 * - `Value`: Should be read as an offset value
 * to add or subtract from a Reference (e.g. `3`)
 */
export enum ValueType {
  Immediate,
  Reference,
  Value,
}

/**
 * OffsetValue is an object to conveniently represent
 * the parsed offset of a reference
 *
 * Depending on the valueType, `immediate`,
 * `reference` and/or`value` are assigned a value
 *
 * A `ValueType.Reference` value can be `dereferenced`,
 * meaning that the value that will be used is the
 * memory cell read at the computed address rather than the computed address.
 */
export type OffsetValue = {
  valueType: ValueType;
  dereferenced: boolean;
  immediate?: Felt;
  value?: number;
  register?: Register;
};

/**
 * Parse a `reference` from the compilation artifact
 * and output it in an exploitable format
 *
 * A reference follows the general pattern
 * `cast(Offset1 + Offset2, valueType)`
 * or `[cast(Offset1 + Offset2, valueType)]` if dereferenced
 *
 * - `valueType`: the reference value type (e.g. `felt*` in `cast(ap + 1, felt*)`)
 * - `dereferenced`: flag whether the return value is
 * the memory read at the computed address or the computed address
 *
 * Example with `ap + 1 = Relocatable(0, 2)` and `[ap + 1] = 10`
 * - `cast(ap + 1, felt*)` returns `Relocatable(0, 2)`
 * - `[cast(ap + 1, felt)]` returns `Felt(10n)`
 *
 * - `apTrackingData`: The correction to apply if one
 * of the OffsetValue is a reference to AP.
 * It is needed because AP changes at almost each instruction,
 * thus the value of AP between the variable assignment
 * and the hint execution may vary.
 *
 * - `offset1` The first OffsetValue.
 * - `offset2` The second OffsetValue. It cannot be an Immediate
 */
export class HintReference {
  constructor(
    public valueType: string,
    public dereferenced: boolean,
    public apTrackingData: ApTrackingData,
    public offset1: OffsetValue,
    public offset2?: OffsetValue
  ) {
    this.valueType = valueType;
    this.dereferenced = dereferenced;
    this.apTrackingData = apTrackingData;
    this.offset1 = offset1;
    this.offset2 = offset2;
  }

  /**
   * Parse a reference string from the compilation artifact to an object
   *
   * @param reference The reference from the compilation artifact to be parsed
   * @returns {HintReference} A HintReference object later used in the IdsManager to execute hints
   *
   * NOTE: Reference pattern
   * - `cast(offset1 + offset2)`
   * - `[cast(offset1 + offset2)]`
   *
   * with `offset1`: `immediate`, `reg1 + value1` or `[reg1 + value1]`
   *
   * with `offset2`: `undefined`, `reg2 + value2`, `[reg2 + value2]` or `value2`
   *
   * `offset2` is always undefined is `offset1` is `immediate` (e.g. `cast(42, felt)`)
   *
   * `value1` and `value2` are relative integers. If negative,
   * they are wrapped into parenthesis (e.g. `cast(ap + (-1), felt*)`)
   */
  static parseReference(reference: Reference): HintReference {
    const dereferenced =
      reference.value.startsWith('[') && reference.value.endsWith(']');
    const ref = dereferenced ? reference.value.slice(1, -1) : reference.value;

    const castMatch = ref.match(/^cast\((.+), (.+)\)$/);
    if (!castMatch) throw new InvalidReference(ref);
    const [, offsetExpr, valueType] = castMatch;

    const offsetMatch = offsetExpr.match(
      /^(\[?[^\[\]]+\]?)(?: \+ (\[?[^\[\]]+\]?))*$/
    );

    if (!offsetMatch) throw new InvalidOffsetExpr(offsetExpr, ref);
    const [, offsetStr1, offsetStr2] = offsetMatch;

    if (!isNaN(Number(offsetStr1)) && !offsetStr2) {
      const offset1: OffsetValue = {
        dereferenced: false,
        valueType: ValueType.Immediate,
        immediate: new Felt(BigInt(offsetStr1)),
      };
      return new HintReference(
        valueType,
        dereferenced,
        reference.ap_tracking_data,
        offset1
      );
    }

    const derefOffset1 = offsetStr1.startsWith('[') && offsetStr1.endsWith(']');
    const off1Array = derefOffset1
      ? offsetStr1
          .slice(1, -1)
          .split('+')
          .map((str) => str.trim())
      : offsetStr1.split('+').map((str) => str.trim());
    // Handle special case `cast(reg - value1 + value2)`
    if (off1Array[0] !== 'fp' && off1Array[0] !== 'ap') {
      const off1SubExpr = off1Array[0].split('-').map((str) => str.trim());
      if (
        off1SubExpr.length !== 2 ||
        (off1SubExpr[0] !== 'fp' && off1SubExpr[0] !== 'ap')
      )
        throw new InvalidOffsetExpr(offsetStr1, ref);
      const value =
        off1SubExpr[1].startsWith('(') && off1SubExpr[1].endsWith(')')
          ? off1SubExpr[1].slice(1, -1)
          : off1SubExpr[1];
      if (isNaN(Number(value))) throw new InvalidOffsetExpr(offsetStr1, ref);
      const offset1: OffsetValue = {
        valueType: ValueType.Reference,
        dereferenced: derefOffset1,
        register: off1SubExpr[0] === 'fp' ? Register.Fp : Register.Ap,
        value: -Number(value),
      };
      const offset2: OffsetValue = {
        valueType: ValueType.Value,
        dereferenced: false,
        value: Number(off1Array[1]),
      };
      return new HintReference(
        valueType,
        dereferenced,
        reference.ap_tracking_data,
        offset1,
        offset2
      );
    }

    let off1: number = 0;
    if (off1Array[1]) {
      const value =
        off1Array[1].startsWith('(') && off1Array[1].endsWith(')')
          ? off1Array[1].slice(1, -1)
          : off1Array[1];
      if (isNaN(Number(value))) throw new InvalidOffsetExpr(offsetStr1, ref);
      off1 = Number(value);
    }

    const offset1: OffsetValue = {
      valueType: ValueType.Reference,
      dereferenced: derefOffset1,
      register: off1Array[0] === 'fp' ? Register.Fp : Register.Ap,
      value: off1,
    };

    if (!offsetStr2) {
      if (off1Array[2]) {
        const value =
          off1Array[2].startsWith('(') && off1Array[2].endsWith(')')
            ? off1Array[2].slice(1, -1)
            : off1Array[2];
        if (isNaN(Number(value))) throw new InvalidOffsetExpr(offsetStr1, ref);

        const offset2 = {
          valueType: ValueType.Value,
          dereferenced: false,
          value: Number(value),
        };

        return new HintReference(
          valueType,
          dereferenced,
          reference.ap_tracking_data,
          offset1,
          offset2
        );
      }
      return new HintReference(
        valueType,
        dereferenced,
        reference.ap_tracking_data,
        offset1
      );
    }

    const derefOffset2 = offsetStr2.startsWith('[') && offsetStr2.endsWith(']');
    const off2Array = derefOffset2
      ? offsetStr2
          .slice(1, -1)
          .split('+')
          .map((str) => str.trim())
      : offsetStr2.split('+').map((str) => str.trim());

    if (off2Array[0] !== 'fp' && off2Array[0] !== 'ap') {
      const value =
        off2Array[0].startsWith('(') && off2Array[0].endsWith(')')
          ? off2Array[0].slice(1, -1)
          : off2Array[0];
      if (isNaN(Number(value))) throw new InvalidOffsetExpr(offsetStr2, ref);
      const offset2: OffsetValue = {
        dereferenced: false,
        valueType: ValueType.Value,
        value: Number(value),
      };
      return new HintReference(
        valueType,
        dereferenced,
        reference.ap_tracking_data,
        offset1,
        offset2
      );
    }
    let off2: number = 0;
    if (off2Array[1]) {
      const value =
        off2Array[1].startsWith('(') && off2Array[1].endsWith(')')
          ? off2Array[1].slice(1, -1)
          : off2Array[1];
      if (isNaN(Number(value))) throw new InvalidOffsetExpr(offsetStr1, ref);
      off2 = Number(value);
    }

    const offset2: OffsetValue = {
      valueType: ValueType.Reference,
      dereferenced: derefOffset2,
      register: off2Array[0] === 'fp' ? Register.Fp : Register.Ap,
      value: off2,
    };
    return new HintReference(
      valueType,
      dereferenced,
      reference.ap_tracking_data,
      offset1,
      offset2
    );
  }
}
