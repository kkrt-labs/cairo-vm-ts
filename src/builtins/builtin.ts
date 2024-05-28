import { SegmentValue } from 'primitives/segmentValue';
import { bitwiseHandler } from './bitwise';

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
export const BUILTIN_HANDLER: {
  [key: string]: BuiltinHandler;
} = {
  bitwise: bitwiseHandler,
};
