import { SegmentValue } from 'primitives/segmentValue';
import { bitwiseHandler } from './bitwise';
import { ecOpHandler } from './ecop';
import { ecdsaHandler } from './ecdsa';
import { pedersenHandler } from './pedersen';
import { poseidonHandler } from './poseidon';
import { keccakHandler } from './keccak';
import { outputHandler } from './output';
import { rangeCheckHandler } from './rangeCheck';

/** Proxy handler to abstract validation & deduction rules off the VM */
export type BuiltinHandler = ProxyHandler<Array<SegmentValue>>;

/**
 * Object to map builtin names to their ProxyHandler:
 * - Bitwise: Builtin for bitwise operations
 * - RangeCheck: Builtin for inequality operations
 * - ECDSA: Builtin for Elliptic Curve Digital Signature Algorithm
 * - EcOp: Builtin for Elliptic curve Operations
 * - Keccak: Builtin for keccak hash family
 * - Pedersen: Builtin for pedersen hash family
 * - Poseidon: Builtin for poseidon hash family
 * - Segment Arena: Unknown usage, must investigate
 * - Output: Output builtin
 */
const BUILTIN_HANDLER: {
  [key: string]: BuiltinHandler;
} = {
  output: outputHandler,
  bitwise: bitwiseHandler,
  ec_op: ecOpHandler,
  ecdsa: ecdsaHandler,
  pedersen: pedersenHandler,
  poseidon: poseidonHandler,
  keccak: keccakHandler,
  range_check: rangeCheckHandler,
};

/** Getter of the object `BUILTIN_HANDLER` */
export const getBuiltin = (name: string) => BUILTIN_HANDLER[name];
