import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import {
  CellRef,
  OpType,
  Operation,
  ResOp,
  cellRef,
  resOp,
} from './hintParamsSchema';

describe('hintParamsSchema', () => {
  test.each([
    [
      { register: 'AP', offset: 2 },
      { register: Register.Ap, offset: 2 },
    ],
    [
      { register: 'FP', offset: -4 },
      { register: Register.Fp, offset: -4 },
    ],
  ])('should properly parse CellRef', (value, expected: CellRef) => {
    expect(cellRef.parse(value)).toEqual(expected);
  });

  test.each([
    [
      {
        Immediate: '0x1',
      },
      {
        type: OpType.Immediate,
        value: new Felt(1n),
      },
    ],
    [
      {
        Deref: {
          register: 'AP',
          offset: 4,
        },
      },
      {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 4,
        },
      },
    ],
    [
      {
        DoubleDeref: {
          Deref: {
            register: 'FP',
            offset: 3,
          },
          offset: -5,
        },
      },
      {
        type: OpType.DoubleDeref,
        cell: {
          register: Register.Fp,
          offset: 3,
        },
        offset: -5,
      },
    ],
    [
      {
        BinOp: {
          op: 'Add',
          a: {
            register: 'AP',
            offset: 1,
          },
          b: {
            Immediate: '0x02',
          },
        },
      },
      {
        type: OpType.BinOp,
        op: Operation.Add,
        a: {
          register: Register.Ap,
          offset: 1,
        },
        b: {
          type: OpType.Immediate,
          value: new Felt(2n),
        },
      },
    ],
    [
      {
        BinOp: {
          op: 'Mul',
          a: {
            register: 'AP',
            offset: 1,
          },
          b: {
            Deref: {
              register: 'AP',
              offset: -6,
            },
          },
        },
      },
      {
        type: OpType.BinOp,
        op: Operation.Mul,
        a: {
          register: Register.Ap,
          offset: 1,
        },
        b: {
          type: OpType.Deref,
          cell: {
            register: Register.Ap,
            offset: -6,
          },
        },
      },
    ],
  ])('should properly parse ResOp', (value, expected: ResOp) => {
    expect(resOp.parse(value)).toEqual(expected);
  });
});
