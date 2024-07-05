import { z } from 'zod';

import { Register } from 'vm/instruction';
import { Felt } from 'primitives/felt';

/**
 * Types to distinguish ResOp pattern
 *
 * Generic patterns:
 * - Deref: `[register + offset]`
 * - DoubleDeref: `[[register + offset1] + offset2]`
 * - Immediate: `0x1000`
 * - BinOp (Add): `[register1 + offset1] + [register2 + offset2]`
 * - BinOp (Mul): `[register1 + offset1] * [register2 + offset2]`
 */
export enum OpType {
  Deref = 'Deref',
  DoubleDeref = 'DoubleDeref',
  Immediate = 'Immediate',
  BinOp = 'BinOp',
}

/** Zod object to parse CellRef */
export const cellRef = z.object({
  register: z.enum(['AP', 'FP']).transform((reg) => {
    if (reg === 'AP') return Register.Ap;
    if (reg === 'FP') return Register.Fp;
    return Register.Pc;
  }),
  offset: z.number(),
});

/** Zod object to parse Deref */
const deref = z
  .object({
    Deref: cellRef,
  })
  .transform((object) => ({
    type: OpType.Deref,
    cell: object.Deref,
  }));

/** Zod object to parse DoubleDeref */
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

/** Zod object to parse Immediate */
const immediate = z
  .object({
    Immediate: z.string().transform((value) => new Felt(BigInt(value))),
  })
  .transform((object) => ({ type: OpType.Immediate, value: object.Immediate }));

/**
 * Operation that can be done by a BinOp
 */
export enum Operation {
  Add = 'Add',
  Mul = 'Mul',
}

/** Zod object to parse a BinOp */
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

/** Zod object to parse a ResOp */
export const resOp = z.union([deref, doubleDeref, immediate, binOp]);

/**
 * A CellRef is an object defining a register and an offset
 *
 * `register + offset`
 */
export type CellRef = z.infer<typeof cellRef>;

/**
 * A Deref is a CellRef wrapped in a `Deref` field
 *
 * `[register + offset]`
 */
export type Deref = z.infer<typeof deref>;

/**
 * A DoubleDeref is a Deref wrapped in a `DoubleDeref` field
 * with a second offset
 *
 * `[[register + offset] + offset]`
 */
export type DoubleDeref = z.infer<typeof doubleDeref>;

/**
 * An Immediate is an hex string representing a Felt,
 * wrapped in an `Immediate` field
 *
 * `0x1000`
 */
export type Immediate = z.infer<typeof immediate>;

/**
 * A BinOp is an addition or a multiplication
 * between two values.
 * - `a` is a cellRef which should points to a Felt
 * - `b` is either a Deref or an Immediate, should be a Felt in both cases.
 */
export type BinOp = z.infer<typeof binOp>;

/** A ResOp is either a Deref, DoubleDeref, Immediate or BinOp */
export type ResOp = z.infer<typeof resOp>;

/** Name to identify which hint is executed  */
export enum HintName {
  AllocSegment = 'AllocSegment',
  TestLessThan = 'TestLessThan',
}

/** Zod object to parse AllocSegment hint */
export const allocSegment = z
  .object({ AllocSegment: z.object({ dst: cellRef }) })
  .transform(({ AllocSegment: { dst } }) => ({
    type: HintName.AllocSegment,
    dst,
  }));

/** Zod object to parse TestLessThan hint */
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

/**
 * AllocSegment hint
 *
 * Add a new segment and store its pointer to `dst`
 */
export type AllocSegment = z.infer<typeof allocSegment>;

/**
 * TestLessThan hint
 *
 * Store true at `dst` if value at `lhs` is stricty inferior to value at `rhs`.
 * Store false otherwise
 */
export type TestLessThan = z.infer<typeof testLessThan>;

/** Zod object to parse any implemented hints */
const hint = z.union([allocSegment, testLessThan]);

/** Zod object to parse an array of hints grouped on a given PC */
export const hintsGroup = z.tuple([z.number(), z.array(hint)]);

/** Zod object to parse an array of grouped hints */
export const hints = z
  .array(hintsGroup)
  .transform((hints) => new Map<number, Hint[]>(hints));

/** Union of all the implemented hints */
export type Hint = z.infer<typeof hint>;

/**
 * Tuple representing hints grouped at a PC offset
 *
 * - Format: `[PC.offset, Hint[]]`
 * - Example: `[5, [AllocSegment, TestLessThan]]`
 */
export type HintsGroup = z.infer<typeof hintsGroup>;

/** Array of HintsGroup
 *
 * Example: `[[2, TestLessThan], [5, AllocSegment, TestLessTha]]`
 */
export type Hints = z.infer<typeof hints>;
