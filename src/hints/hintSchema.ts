import { z } from 'zod';

import { Register } from 'vm/instruction';
import { Felt } from 'primitives/felt';

export enum OpType {
  Deref,
  DoubleDeref,
  Immediate,
  BinOp,
}

export const cellRef = z.object({
  register: z.enum(['AP', 'FP']).transform((reg) => {
    if (reg === 'AP') return Register.Ap;
    if (reg === 'FP') return Register.Fp;
    return Register.Pc;
  }),
  offset: z.number(),
});

const deref = z
  .object({
    Deref: cellRef,
  })
  .transform((object) => ({
    type: OpType.Deref,
    cell: object.Deref,
  }));

const doubleDeref = z
  .object({
    DoubleDeref: z.object({
      Deref: cellRef,
      offset: z.number(),
    }),
  })
  .transform((object) => ({
    type: OpType.DoubleDeref,
    cell: object.DoubleDeref.Deref,
    offset: object.DoubleDeref.offset,
  }));

const immediate = z
  .object({
    Immediate: z.string().transform((value) => new Felt(BigInt(value))),
  })
  .transform((object) => ({ type: OpType.Immediate, value: object.Immediate }));

export enum Operation {
  Add,
  Mul,
}

const binOp = z
  .object({
    BinOp: z.object({
      op: z.enum(['Add', 'Mul']).transform((op) => {
        return op === 'Add' ? Operation.Add : Operation.Mul;
      }),
      a: cellRef,
      b: z.union([deref, immediate]),
    }),
  })
  .transform((object) => ({
    type: OpType.BinOp,
    op: object.BinOp.op,
    a: object.BinOp.a,
    b: object.BinOp.b,
  }));

export const resOp = z.union([deref, doubleDeref, immediate, binOp]);

export type CellRef = z.infer<typeof cellRef>;
export type Deref = z.infer<typeof deref>;
export type DoubleDeref = z.infer<typeof doubleDeref>;
export type Immediate = z.infer<typeof immediate>;
export type BinOp = z.infer<typeof binOp>;
export type ResOp = z.infer<typeof resOp>;

export enum HintName {
  AllocSegment,
  TestLessThan,
}

export const allocSegment = z
  .object({ AllocSegment: z.object({ dst: cellRef }) })
  .transform(({ AllocSegment: { dst } }) => ({
    type: HintName.AllocSegment,
    dst,
  }));

export const testLessThan = z
  .object({
    TestLessThan: z.object({ lhs: resOp, rhs: resOp, dst: cellRef }),
  })
  .transform(({ TestLessThan: { lhs, rhs, dst } }) => ({
    type: HintName.TestLessThan,
    lhs,
    rhs,
    dst,
  }));

export type AllocSegment = z.infer<typeof allocSegment>;
export type TestLessThan = z.infer<typeof testLessThan>;

const hint = z.union([allocSegment, testLessThan]);

export const hintsGroup = z.tuple([z.number(), z.array(hint)]);

export type Hint = z.infer<typeof hint>;
export type HintsGroup = z.infer<typeof hintsGroup>;
