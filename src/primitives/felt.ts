import { MaybeRelocatable, Relocatable } from './relocatable';

import { ForbiddenOperation, OutOfRangeBigInt } from 'errors/primitives';

export class Felt {
  private inner: bigint;
  static PRIME: bigint =
    0x800000000000011000000000000000000000000000000000000000000000001n;
  static ZERO: Felt = new Felt(0n);
  constructor(_inner: bigint) {
    while (_inner < 0n) _inner += Felt.PRIME;
    this.inner = _inner % Felt.PRIME;
  }

  add(other: MaybeRelocatable): Felt {
    if (!(other instanceof Felt)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner + other.inner);
  }

  sub(other: MaybeRelocatable): Felt {
    if (!(other instanceof Felt)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner - other.inner);
  }

  mul(other: MaybeRelocatable): Felt {
    if (!(other instanceof Felt)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner * other.inner);
  }

  div(other: MaybeRelocatable): Felt {
    if (!(other instanceof Felt) || other.inner === 0n) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner / other.inner);
  }

  eq(other: MaybeRelocatable): boolean {
    if (other instanceof Relocatable) {
      return false;
    }

    return this.inner == other.inner;
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

  static isFelt(maybeRelocatable: MaybeRelocatable): maybeRelocatable is Felt {
    return maybeRelocatable instanceof Felt;
  }
}
