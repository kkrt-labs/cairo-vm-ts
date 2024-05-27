import { Segment } from 'memory/memory';
import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';

/** Abstract class representing builtin runners */
export abstract class BuiltinRunnerBase {
  constructor() {}
  /** Verify that a property of the segment (if any) is respected
   * when asserting constraints (`assertEq`) */
  validate(_segment: Segment): void {}
  /** Infer value from the previous cells of the segment when reading from memory (`get`)*/
  infer(_segment: Segment, _address: Relocatable): SegmentValue | undefined {
    return undefined;
  }
  /** @return builtin name */
  abstract toString(): string;
}

/**
 * Union of the different builtin runners:
 * - NoBuiltin: memory segments that are not builtins
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
export type BuiltinRunner = NoBuiltin;

/**
 *  BuiltinRunner that enforces no rules
 *
 * Default builtin runner for memory segments,
 *
 * Essentially for segments that are not builtins:
 * - Program segment
 * - Execution segment
 * - User segments
 */
export class NoBuiltin extends BuiltinRunnerBase {
  toString(): string {
    return 'No builtin';
  }
}
