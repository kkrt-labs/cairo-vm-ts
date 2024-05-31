import { ProjectivePoint } from '@scure/starknet';
import { BuiltinHandler } from './builtin';
import { isFelt } from 'primitives/segmentValue';
import { ExpectedFelt } from 'errors/virtualMachine';
import { Felt } from 'primitives/felt';
import { LadderFailed } from 'errors/builtins';

const _1n = BigInt(1);

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

    const cellsPerEcOp = 7;
    const inputCellsPerEcOp = 5;

    const offset = Number(prop);
    const ecOpIndex = offset % cellsPerEcOp;
    if (ecOpIndex < inputCellsPerEcOp) {
      return target[offset];
    }

    const inputOffset = offset - ecOpIndex;
    const outputOffset = inputOffset + inputCellsPerEcOp;

    const inputs = target.slice(inputOffset, outputOffset).map((value) => {
      if (!isFelt(value)) throw new ExpectedFelt();
      return value.toBigInt();
    });

    const p = ProjectivePoint.fromAffine({ x: inputs[0], y: inputs[1] });
    const q = ProjectivePoint.fromAffine({ x: inputs[2], y: inputs[3] });

    const r = p.multiplyAndAddUnsafe(q, _1n, inputs[4]);
    if (r === undefined) throw new LadderFailed();

    switch (ecOpIndex - inputCellsPerEcOp) {
      case 0:
        return (target[outputOffset] = new Felt(r.x));
      default:
        return (target[outputOffset + 1] = new Felt(r.y));
    }
  },
};
