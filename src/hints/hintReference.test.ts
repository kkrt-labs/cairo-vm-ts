import { describe, expect, test } from 'bun:test';

import { InvalidOffsetExpr, InvalidReference } from 'errors/hintReference';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { ApTrackingData, Reference } from 'vm/program';
import { HintReference, ValueType } from './hintReference';

const AP_TRACKING_DATA_DEFAULT: ApTrackingData = {
  group: 0,
  offset: 0,
};

describe('reference', () => {
  test.each([
    [
      'cast(42, felt)',
      new HintReference('felt', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Immediate,
        dereferenced: false,
        immediate: new Felt(42n),
      }),
    ],
    [
      'cast(-42, felt)',
      new HintReference('felt', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Immediate,
        dereferenced: false,
        immediate: new Felt(-42n),
      }),
    ],
    [
      'cast(ap, felt*)',
      new HintReference('felt*', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Reference,
        dereferenced: false,
        register: Register.Ap,
        value: 0,
      }),
    ],
    [
      'cast([ap], felt*)',
      new HintReference('felt*', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Reference,
        dereferenced: true,
        register: Register.Ap,
        value: 0,
      }),
    ],
    [
      '[cast(fp, felt**)]',
      new HintReference('felt**', true, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Reference,
        dereferenced: false,
        register: Register.Fp,
        value: 0,
      }),
    ],
    [
      'cast(ap + 1, felt*)',
      new HintReference('felt*', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Reference,
        dereferenced: false,
        register: Register.Ap,
        value: 1,
      }),
    ],
    [
      'cast(ap + (-1), felt*)',
      new HintReference('felt*', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Reference,
        dereferenced: false,
        register: Register.Ap,
        value: -1,
      }),
    ],
    [
      'cast([fp + (-1)], felt)',
      new HintReference('felt', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Reference,
        dereferenced: true,
        register: Register.Fp,
        value: -1,
      }),
    ],
    [
      'cast(ap + 1 + 3, felt*)',
      new HintReference(
        'felt*',
        false,
        AP_TRACKING_DATA_DEFAULT,
        {
          valueType: ValueType.Reference,
          dereferenced: false,
          register: Register.Ap,
          value: 1,
        },
        { valueType: ValueType.Value, dereferenced: false, value: 3 }
      ),
    ],
    [
      'cast(ap - 1 + 3, felt*)',
      new HintReference(
        'felt*',
        false,
        AP_TRACKING_DATA_DEFAULT,
        {
          valueType: ValueType.Reference,
          dereferenced: false,
          register: Register.Ap,
          value: -1,
        },
        { valueType: ValueType.Value, dereferenced: false, value: 3 }
      ),
    ],
    [
      'cast(ap + (-1) + 3, felt*)',
      new HintReference(
        'felt*',
        false,
        AP_TRACKING_DATA_DEFAULT,
        {
          valueType: ValueType.Reference,
          dereferenced: false,
          register: Register.Ap,
          value: -1,
        },
        { valueType: ValueType.Value, dereferenced: false, value: 3 }
      ),
    ],
    [
      'cast([ap + (-1)] + 3, felt)',
      new HintReference(
        'felt',
        false,
        AP_TRACKING_DATA_DEFAULT,
        {
          valueType: ValueType.Reference,
          dereferenced: true,
          register: Register.Ap,
          value: -1,
        },
        { valueType: ValueType.Value, dereferenced: false, value: 3 }
      ),
    ],
    [
      'cast(ap + (-1) + [fp + 3], felt*)',
      new HintReference(
        'felt*',
        false,
        AP_TRACKING_DATA_DEFAULT,
        {
          valueType: ValueType.Reference,
          dereferenced: false,
          register: Register.Ap,
          value: -1,
        },
        {
          valueType: ValueType.Reference,
          dereferenced: true,
          register: Register.Fp,
          value: 3,
        }
      ),
    ],
    [
      'cast([ap + (-1)] + fp + 3, felt*)',
      new HintReference(
        'felt*',
        false,
        AP_TRACKING_DATA_DEFAULT,
        {
          valueType: ValueType.Reference,
          dereferenced: true,
          register: Register.Ap,
          value: -1,
        },
        {
          valueType: ValueType.Reference,
          dereferenced: false,
          register: Register.Fp,
          value: 3,
        }
      ),
    ],
    [
      'cast([ap + (-1)] + [fp + (-3)], felt)',
      new HintReference(
        'felt',
        false,
        AP_TRACKING_DATA_DEFAULT,
        {
          valueType: ValueType.Reference,
          dereferenced: true,
          register: Register.Ap,
          value: -1,
        },
        {
          valueType: ValueType.Reference,
          dereferenced: true,
          register: Register.Fp,
          value: -3,
        }
      ),
    ],
    [
      'cast(42, custom.type)',
      new HintReference('custom.type', false, AP_TRACKING_DATA_DEFAULT, {
        valueType: ValueType.Immediate,
        dereferenced: false,
        immediate: new Felt(42n),
      }),
    ],
  ])('should correctly parse reference', (refValue, expectedRef) => {
    const reference: Reference = {
      ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
      pc: 0,
      value: refValue,
    };
    expect(HintReference.parseReference(reference)).toEqual(expectedRef);
  });

  test('should throw InvalidReference when parsing cat(ap + 1, felt)', () => {
    const reference: Reference = {
      ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
      pc: 0,
      value: 'cat(ap + 1, felt)',
    };
    expect(() => HintReference.parseReference(reference)).toThrow(
      new InvalidReference('cat(ap + 1, felt)')
    );
  });

  test('should throw InvalidOffsetExpr when parsing cast(app + 1, felt)', () => {
    const reference: Reference = {
      ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
      pc: 0,
      value: 'cast(app + 1, felt)',
    };
    expect(() => HintReference.parseReference(reference)).toThrow(
      new InvalidOffsetExpr('app + 1', 'cast(app + 1, felt)')
    );
  });

  test('should throw InvalidOffsetExpr when parsing cast(ap + 1 + gp, felt*)', () => {
    const reference: Reference = {
      ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
      pc: 0,
      value: 'cast(ap + 1 + gp, felt*)',
    };
    expect(() => HintReference.parseReference(reference)).toThrow(
      new InvalidOffsetExpr('ap + 1 + gp', 'cast(ap + 1 + gp, felt*)')
    );
  });

  test('should throw InvalidOffsetExpr when parsing cast([ap + 1] + gp, felt*)', () => {
    const reference: Reference = {
      ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
      pc: 0,
      value: 'cast([ap + 1] + gp, felt*)',
    };
    expect(() => HintReference.parseReference(reference)).toThrow(
      new InvalidOffsetExpr('gp', 'cast([ap + 1] + gp, felt*)')
    );
  });
});
