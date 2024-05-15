import { ForbiddenOperation } from 'errors/primitives';

import { SegmentValue, isFelt, isRelocatable } from './segmentValue';

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

  add(other: SegmentValue): Felt {
    if (!isFelt(other)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner + other.inner);
  }

  sub(other: SegmentValue): Felt {
    if (!isFelt(other)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner - other.inner);
  }

  mul(other: SegmentValue): Felt {
    if (!isFelt(other)) {
      throw new ForbiddenOperation();
    }

    return new Felt(this.inner * other.inner);
  }

  div(other: SegmentValue): Felt {
    if (!isFelt(other) || other.inner === 0n) {
      throw new ForbiddenOperation();
    }

    return this.mul(other.inv());
  }

  eq(other: SegmentValue): boolean {
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

  /**
   * @dev Compute modular multiplicative inverse with
   * Euler totient's function and Fermat's little theorem
   */
  private inv(): Felt {
    return this.pow(Felt.PRIME - 2n);
  }

  /** @dev Binary Exponentiation - Iterative version */
  private pow(exp: bigint): Felt {
    if (exp === 0n) return new Felt(1n);
    if (exp === 1n) return this;
    let res = 1n;
    let inner = this.inner;
    while (exp !== 0n) {
      if (exp & 1n) {
        res = (res * inner) % Felt.PRIME;
      }
      inner = (inner * inner) % Felt.PRIME;
      exp >>= 1n;
    }
    return new Felt(res);
  }
}
