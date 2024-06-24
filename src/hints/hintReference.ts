import { ApTrackingData, Reference } from 'vm/program';
import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { InvalidOffsetExpr, InvalidReference } from 'errors/hintReference';

export enum ValueType {
  Value,
  Immediate,
  Reference,
}

export type OffsetValue = {
  valueType: ValueType;
  dereferenced: boolean;
  immediate?: Felt;
  value?: number;
  register?: Register;
};

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

  static parseReference(reference: Reference) {
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
    // cast(fp - 2 + 5, felt*)
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
    // cast(fp + (-2), felt*)
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
