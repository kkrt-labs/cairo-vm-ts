import { ProjectivePoint } from '@scure/starknet';
import { BuiltinHandler } from './builtin';
import { isFelt } from 'primitives/segmentValue';
import { ExpectedFelt } from 'errors/primitives';
import { Felt } from 'primitives/felt';
import { LadderFailed } from 'errors/builtins';

const _1n = BigInt(1);

/** Total number of cells per ec_op operation */
export const CELLS_PER_EC_OP = 7;

/** Number of input cells for a ec_op operation */
export const INPUT_CELLS_PER_EC_OP = 5;

/**
 * EcOp Builtin - Computes R = P + mQ
 * P and Q are points on the STARK curve
 * m is a scalar (a strictly positive element of the STARK Field)
 */
export const ecOpHandler: BuiltinHandler = {
  get(target, prop) {
    if (isNaN(Number(prop))) {
      return Reflect.get(target, prop);
    }

    const offset = Number(prop);
    const ecOpIndex = offset % CELLS_PER_EC_OP;
    if (ecOpIndex < INPUT_CELLS_PER_EC_OP || target[offset]) {
      return target[offset];
    }

    const inputOffset = offset - ecOpIndex;
    const outputOffset = inputOffset + INPUT_CELLS_PER_EC_OP;

    const inputs = target.slice(inputOffset, outputOffset).map((value) => {
      if (!isFelt(value)) throw new ExpectedFelt(value);
      return value.toBigInt();
    });

    const p = ProjectivePoint.fromAffine({ x: inputs[0], y: inputs[1] });
    const q = ProjectivePoint.fromAffine({ x: inputs[2], y: inputs[3] });

    const r = p.multiplyAndAddUnsafe(q, _1n, inputs[4]);
    if (r === undefined) throw new LadderFailed();

    switch (ecOpIndex - INPUT_CELLS_PER_EC_OP) {
      case 0:
        return (target[outputOffset] = new Felt(r.x));
      default:
        return (target[outputOffset + 1] = new Felt(r.y));
    }
  },
};
