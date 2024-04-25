import { MaybeRelocatable, Relocatable } from './relocatable';

import {
  ForbiddenOperation,
  OutOfRangeBigInt,
  PrimitiveError,
} from 'errors/primitives';

export class Felt {
  private inner: bigint;
  static PRIME: bigint =
    0x800000000000011000000000000000000000000000000000000000000000001n;
  static ZERO: Felt = new Felt(0n);
  constructor(_inner: bigint) {
    if (_inner < 0n || _inner > Felt.PRIME) {
      throw new PrimitiveError(OutOfRangeBigInt);
    }
    this.inner = _inner;
  }

  add(other: MaybeRelocatable): Felt {
    if (MaybeRelocatable.isFelt(other)) {
      return new Felt((this.inner + other.inner) % Felt.PRIME);
    }
    throw new PrimitiveError(ForbiddenOperation);
  }

  sub(other: MaybeRelocatable): Felt {
    if (!MaybeRelocatable.isFelt(other)) {
      throw new PrimitiveError(ForbiddenOperation);
    }

    let result = this.inner - other.inner;
    if (result < 0n) {
      result += Felt.PRIME;
    }
    return new Felt(result);
  }

  mul(other: MaybeRelocatable): Felt {
    if (MaybeRelocatable.isFelt(other)) {
      return new Felt((this.inner * other.inner) % Felt.PRIME);
    }
    throw new PrimitiveError(ForbiddenOperation);
  }

  div(other: MaybeRelocatable): Felt {
    if (!MaybeRelocatable.isFelt(other) || other.inner === 0n) {
      throw new PrimitiveError(ForbiddenOperation);
    }
    return new Felt(this.inner / other.inner);
  }

  eq(other: MaybeRelocatable): boolean {
    return !MaybeRelocatable.isRelocatable(other) && this.inner === other.inner;
  }

  toString(): string {
    return this.inner.toString();
  }

  toBigInt(): bigint {
    return this.inner;
  }

  toHexString(): string {
    return this.inner.toString(16);
  }
}
