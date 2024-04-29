import { Relocatable } from './relocatable';
import { MaybeRelocatable, isFelt, isRelocatable } from './maybeRelocatable';
import { ForbiddenOperation, OutOfRangeBigInt } from 'errors/primitives';

export class Felt {
  private inner: bigint;
  static PRIME: bigint =
    0x800000000000011000000000000000000000000000000000000000000000001n;
  static ZERO: Felt = new Felt(0n);
  constructor(_inner: bigint) {
    if (_inner < 0n) {
      _inner = (_inner % Felt.PRIME) + Felt.PRIME;
    }
    this.inner = _inner % Felt.PRIME;
  }

  add(other: MaybeRelocatable): Felt {
    if (!isFelt(other)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner + other.inner);
  }

  sub(other: MaybeRelocatable): Felt {
    if (!isFelt(other)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner - other.inner);
  }

  mul(other: MaybeRelocatable): Felt {
    if (!isFelt(other)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner * other.inner);
  }

  div(other: MaybeRelocatable): Felt {
    if (!isFelt(other) || other.inner === 0n) {
      throw new ForbiddenOperation();
    }
    return new Felt(this.inner / other.inner);
  }

  eq(other: MaybeRelocatable): boolean {
    return !isRelocatable(other) && this.inner === other.inner;
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
