import { SegmentValue } from 'primitives/segmentValue';

import { outputHandler } from './output';
import { CELLS_PER_PEDERSEN, pedersenHandler } from './pedersen';
import { rangeCheckHandler } from './rangeCheck';
import { CELLS_PER_ECDSA, ecdsaHandler } from './ecdsa';
import { bitwiseHandler, CELLS_PER_BITWISE } from './bitwise';
import { CELLS_PER_EC_OP, ecOpHandler } from './ecop';
import { CELLS_PER_KECCAK, keccakHandler } from './keccak';
import { CELLS_PER_POSEIDON, poseidonHandler } from './poseidon';
import { segmentArenaHandler } from './segmentArena';

/** Proxy handler to abstract validation & deduction rules off the VM */
export type BuiltinHandler = ProxyHandler<Array<SegmentValue>>;

/**
 * Object to map builtin names to their ProxyHandler:
 * - Output: Output builtin
 * - Pedersen: Builtin for pedersen hash family
 * - RangeCheck: Builtin for inequality operations
 * - ECDSA: Builtin for Elliptic Curve Digital Signature Algorithm
 * - Bitwise: Builtin for bitwise operations
 * - EcOp: Builtin for Elliptic curve Operations
 * - Keccak: Builtin for keccak hash family
 * - Poseidon: Builtin for poseidon hash family
 * - Segment Arena: Builtin to manage the dictionaries
 */
const BUILTIN_HANDLER: {
  [key: string]: BuiltinHandler;
} = {
  output: outputHandler,
  pedersen: pedersenHandler,
  range_check: rangeCheckHandler(128n),
  ecdsa: ecdsaHandler,
  bitwise: bitwiseHandler,
  ec_op: ecOpHandler,
  keccak: keccakHandler,
  poseidon: poseidonHandler,
  range_check96: rangeCheckHandler(96n),
  segment_arena: segmentArenaHandler,
};

/** Getter of the object `BUILTIN_HANDLER` */
export const getBuiltin = (name: string) => BUILTIN_HANDLER[name];

export const CELLS_PER_INSTANCE: {
  [key: string]: number;
} = {
  output: 0,
  pedersen: CELLS_PER_PEDERSEN,
  range_check: 1,
  ecdsa: CELLS_PER_ECDSA,
  bitwise: CELLS_PER_BITWISE,
  ec_op: CELLS_PER_EC_OP,
  keccak: CELLS_PER_KECCAK,
  poseidon: CELLS_PER_POSEIDON,
  range_check96: 1,
};
