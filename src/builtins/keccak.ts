import { bytesToNumberLE, numberToBytesLE } from '@noble/curves/abstract/utils';
import { concatBytes, u32, u8 } from '@noble/hashes/utils';
import { keccakP } from '@noble/hashes/sha3';

import { ExpectedFelt } from 'errors/primitives';

import { Felt } from 'primitives/felt';
import { isFelt } from 'primitives/segmentValue';
import { BuiltinHandler } from './builtin';

const KECCAK_BYTES = 25;
const KECCAK_BITS = 200n;

/**
 * Compute the new state of the keccak-f1600 block permutation on 24 rounds
 *
 * - Input: State s, 1600 bits on 8 memory cells (200 bits each)
 * - Output: State s', 1600 bits on 8 memory cells (200 bits each)
 * with s' = keccak-f1600(s)
 */
export const keccakHandler: BuiltinHandler = {
  get(target, prop) {
    if (isNaN(Number(prop))) {
      return Reflect.get(target, prop);
    }

    const cellsPerKeccak = 16;
    const inputCellsPerKeccak = 8;

    const offset = Number(prop);
    const keccakIndex = offset % cellsPerKeccak;
    if (keccakIndex < inputCellsPerKeccak || target[offset]) {
      return target[offset];
    }

    const inputOffset = offset - keccakIndex;
    const outputOffset = inputOffset + inputCellsPerKeccak;

    const input = concatBytes(
      ...target.slice(inputOffset, outputOffset).map((value) => {
        if (!isFelt(value)) throw new ExpectedFelt(value);
        if (value.toBigInt() >> KECCAK_BITS !== 0n) throw new Error();
        return numberToBytesLE(value.toBigInt(), 25);
      })
    );

    const state = u32(input);
    keccakP(state);
    const finalState = u8(state);

    const outputs = Array.from({ length: 8 }, (_, i) =>
      finalState.slice(i * KECCAK_BYTES, (i + 1) * KECCAK_BYTES)
    ).map(bytesToNumberLE);

    return (target[offset] = new Felt(
      outputs[keccakIndex - inputCellsPerKeccak]
    ));
  },
};
