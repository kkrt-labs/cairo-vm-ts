import { CURVE, ProjectivePoint, Signature, verify } from '@scure/starknet';

import {
  ExpectedOffset,
  InvalidSignature,
  UndefinedECDSASignature,
  UndefinedSignatureDict,
} from 'errors/builtins';
import { ExpectedFelt } from 'errors/primitives';

import { Felt } from 'primitives/felt';
import { SegmentValue, isFelt } from 'primitives/segmentValue';

export type EcdsaSignature = { r: Felt; s: Felt };
type EcdsaSignatureDict = { [key: number]: EcdsaSignature };
export type EcdsaSegment = SegmentValue[] & { signatures: EcdsaSignatureDict };
type EcdsaProxyHandler = ProxyHandler<EcdsaSegment>;

export const CELLS_PER_ECDSA = 2;

const signatureHandler: ProxyHandler<EcdsaSignatureDict> = {
  set(target, prop, newValue): boolean {
    if (isNaN(Number(prop))) throw new ExpectedOffset();
    if (!isFelt(newValue.r)) throw new ExpectedFelt(newValue.r);
    if (!isFelt(newValue.s)) throw new ExpectedFelt(newValue.s);
    const key = Number(prop);
    target[key] = newValue;
    return true;
  },
};

export const ecdsaHandler: EcdsaProxyHandler = {
  get(target, prop) {
    if (prop === 'signatures') {
      if (!target.signatures) {
        target.signatures = new Proxy({}, signatureHandler);
      }
      return target.signatures;
    }
    return Reflect.get(target, prop);
  },

  set(target, prop, newValue): boolean {
    if (prop === 'signatures') {
      if (!target.signatures) {
        target.signatures = new Proxy({}, signatureHandler);
      }
      return true;
    }

    if (isNaN(Number(prop))) throw new ExpectedOffset();
    if (!target.signatures) throw new UndefinedSignatureDict();
    if (!isFelt(newValue)) throw new ExpectedFelt(newValue);

    const offset = Number(prop);
    const ecdsaIndex = offset % CELLS_PER_ECDSA;

    const pubKeyXOffset = ecdsaIndex ? offset - 1 : offset;
    const msgOffset = ecdsaIndex ? offset : offset + 1;

    if (!target[pubKeyXOffset] && !target[msgOffset]) {
      target[offset] = newValue;
      return true;
    }

    // Trying to assert an already constrained value while the other pair
    // (either pub key or message) has not been constrained yet - no sig verif
    if (target[offset]) {
      return true;
    }

    target[offset] = newValue;

    const pubKeyX = target[pubKeyXOffset];
    const msg = target[msgOffset];
    if (!isFelt(pubKeyX)) throw new ExpectedFelt(pubKeyX);
    if (!isFelt(msg)) throw new ExpectedFelt(msg);

    const { yPos, yNeg } = recoverY(pubKeyX);

    const pubKeyPos = ProjectivePoint.fromAffine({
      x: pubKeyX.toBigInt(),
      y: yPos.toBigInt(),
    });

    // TODO: Check that a signature has been added to the signatures cache
    const sig = target.signatures[pubKeyXOffset];
    if (!sig) throw new UndefinedECDSASignature(pubKeyXOffset);

    const signature = new Signature(sig.r.toBigInt(), sig.s.toBigInt());

    if (!verify(signature, msg.toString(16), pubKeyPos.toHex())) {
      const pubKeyNeg = ProjectivePoint.fromAffine({
        x: pubKeyX.toBigInt(),
        y: yNeg.toBigInt(),
      });

      if (!verify(signature, msg.toString(16), pubKeyNeg.toHex()))
        throw new InvalidSignature(
          signature,
          msg,
          pubKeyPos.toHex(),
          pubKeyNeg.toHex()
        );
    }
    return true;
  },
};

/**
 * Recover the y-coordinate from the x-coordinate of the public key
 *
 * Based on the Weierstrass equation of the STARK curve
 * $y^2 = x^3 + a*x + b$
 */
const recoverY = (x: Felt) => {
  const ax = x.mul(new Felt(CURVE.a));
  const x3 = x.mul(x).mul(x);
  const b = new Felt(CURVE.b);
  const y2 = x3.add(ax).add(b);
  // TODO: compute the square root of a STARK felt
  const y = y2.sqrt();

  return { yPos: y, yNeg: y.neg() };
};
