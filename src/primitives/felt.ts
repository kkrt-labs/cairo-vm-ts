import { CURVE } from '@scure/starknet';

import { CannotDivideByZero, ExpectedFelt } from 'errors/primitives';

import { SegmentValue, isFelt, isRelocatable } from './segmentValue';
import { Relocatable } from './relocatable';

export class Felt {
  private inner: bigint;
  static PRIME: bigint =
    0x800000000000011000000000000000000000000000000000000000000000001n;
  static ZERO: Felt = new Felt(0n);

  static from64BitsWords(valuesLE: bigint[]): Felt {
    if (valuesLE.length != 4)
      throw new Error(
        'Invalid argument - Expects an array of 4 bigint of 64 bits each, little-endian ordered'
      );
    const mask = 0xffffffffffffffffn;
    const values = valuesLE.map((value) => value & mask);
    return new Felt(
      values[0] | (values[1] << 64n) | (values[2] << 128n) | (values[3] << 192n)
    );
  }

  constructor(_inner: bigint) {
    if (_inner < 0n) {
      _inner = (_inner % Felt.PRIME) + Felt.PRIME;
    }
    this.inner = _inner % Felt.PRIME;
  }

  add(other: Felt): Felt;
  add(other: number): Felt;
  add(other: Relocatable): Relocatable;
  add(other: SegmentValue): SegmentValue;
  add(other: SegmentValue | number): SegmentValue {
    if (isRelocatable(other)) {
      return other.add(this);
    }

    if (isFelt(other)) {
      return new Felt(this.inner + other.inner);
    }

    return new Felt(this.inner + BigInt(other));
  }

  sub(other: Felt): Felt;
  sub(other: number): Felt;
  sub(other: Relocatable): never;
  sub(other: SegmentValue): SegmentValue;
  sub(other: SegmentValue | number): SegmentValue {
    if (isFelt(other)) {
      return new Felt(this.inner - other.inner);
    }

    if (isRelocatable(other)) {
      throw new ExpectedFelt(other);
    }

    return new Felt(this.inner - BigInt(other));
  }

  mul(other: SegmentValue): Felt {
    if (!isFelt(other)) {
      throw new ExpectedFelt(other);
    }

    return new Felt(this.inner * other.inner);
  }

  neg(): Felt {
    return new Felt(-this.inner);
  }

  div(other: SegmentValue): Felt {
    if (!isFelt(other)) {
      throw new ExpectedFelt(other);
    } else if (other.inner === 0n) {
      throw new CannotDivideByZero();
    }

    return this.mul(other.inv());
  }

  mod(other: SegmentValue): Felt {
    if (!isFelt(other)) throw new ExpectedFelt(other);
    return new Felt(this.inner % other.inner);
  }

  eq(other: SegmentValue): boolean {
    return !isRelocatable(other) && this.inner === other.inner;
  }

  sqrt(): Felt {
    return new Felt(CURVE.Fp.sqrt(this.inner));
  }

  valueOf() {
    return this.inner;
  }

  toString(radix?: number): string {
    return this.inner.toString(radix);
  }

  toBigInt(): bigint {
    return this.inner;
  }

  to64BitsWords(): bigint[] {
    const mask = 0xffffffffffffffffn;
    return [
      this.inner & mask,
      (this.inner >> 64n) & mask,
      (this.inner >> 128n) & mask,
      (this.inner >> 192n) & mask,
    ];
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
