import { bytesToNumberLE, numberToBytesLE } from '@noble/curves/abstract/utils';
import { concatBytes, u32, u8 } from '@noble/hashes/utils';
import { keccakP } from '@noble/hashes/sha3';

import { ExpectedFelt } from 'errors/primitives';

import { Felt } from 'primitives/felt';
import { isFelt } from 'primitives/segmentValue';
import { BuiltinHandler } from './builtin';

const KECCAK_BYTES = 25;
const KECCAK_BITS = 200n;

/** Total number of cells per keccak operation */
export const CELLS_PER_KECCAK = 16;

/** Number of input cells for a keccak operation */
export const INPUT_CELLS_PER_KECCAK = 8;

/**
 * The diluted cells are:
 * - state - 25 rounds times 1600 elements.
 * - parity - 24 rounds times 1600/5 elements times 3 auxiliaries.
 * - after_theta_rho_pi - 24 rounds times 1600 elements.
 * - theta_aux - 24 rounds times 1600 elements.
 * - chi_iota_aux - 24 rounds times 1600 elements times 2 auxiliaries.
 *
 * In total 25 * 1600 + 24 * 320 * 3 + 24 * 1600 + 24 * 1600 + 24 * 1600 * 2 = 216640.
 *
 * But we actually allocate 4 virtual columns, of dimensions 64 * 1024, in which we embed the
 * real cells, and we don't free the unused ones.
 *
 * So the real number is 4 * 64 * 1024 = 262144.
 */
export const KECCAK_DILUTED_CELLS = 262144;

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

    const offset = Number(prop);
    const keccakIndex = offset % CELLS_PER_KECCAK;
    if (keccakIndex < INPUT_CELLS_PER_KECCAK || target[offset]) {
      return target[offset];
    }

    const inputOffset = offset - keccakIndex;
    const outputOffset = inputOffset + INPUT_CELLS_PER_KECCAK;

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
      outputs[keccakIndex - INPUT_CELLS_PER_KECCAK]
    ));
  },
};
