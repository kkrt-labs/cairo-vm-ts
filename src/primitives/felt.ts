import { Uint32, Uint64, UnsignedInteger } from './uint';
import { MaybeRelocatable } from './relocatable';
import { Result } from 'result/result';
import {
  ForbiddenOperation,
  OutOfRangeBigInt,
  PrimitiveError,
} from 'result/primitives';

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

  add(other: MaybeRelocatable): Result<Felt> {
    if (other instanceof Felt) {
      return {
        value: new Felt((this.inner + other.inner) % Felt.PRIME),
        error: undefined,
      };
    }
    return {
      value: undefined,
      error: new PrimitiveError(ForbiddenOperation),
    };
  }

  sub(other: MaybeRelocatable): Result<Felt> {
    if (other instanceof Felt) {
      let result = this.inner - other.inner;
      if (result < 0n) {
        result += Felt.PRIME;
      }
      return { value: new Felt(result), error: undefined };
    }
    return {
      value: undefined,
      error: new PrimitiveError(ForbiddenOperation),
    };
  }

  mul(other: MaybeRelocatable): Result<Felt> {
    if (other instanceof Felt) {
      return {
        value: new Felt((this.inner * other.inner) % Felt.PRIME),
        error: undefined,
      };
    }
    return {
      value: undefined,
      error: new PrimitiveError(ForbiddenOperation),
    };
  }

  div(other: MaybeRelocatable): Result<Felt> {
    if (other instanceof Felt) {
      if (other.inner === 0n) {
        return {
          value: undefined,
          error: new PrimitiveError(ForbiddenOperation),
        };
      }
      let result = this.inner / other.inner;
      return { value: new Felt(result), error: undefined };
    }
    return {
      value: undefined,
      error: new PrimitiveError(ForbiddenOperation),
    };
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

  toUint32(): Result<Uint32> {
    if (this.inner > Number.MAX_SAFE_INTEGER) {
      return {
        value: undefined,
        error: new PrimitiveError(OutOfRangeBigInt),
      };
    }
    return UnsignedInteger.toUint32(Number(this.inner));
  }

  toUint64(): Result<Uint64> {
    return UnsignedInteger.toUint64(this.inner);
  }

  toHexString(): string {
    return this.inner.toString(16);
  }

  static isFelt(maybeRelocatable: MaybeRelocatable): maybeRelocatable is Felt {
    return maybeRelocatable instanceof Felt;
  }

  static getFelt(maybeRelocatable: MaybeRelocatable): Felt | undefined {
    if (Felt.isFelt(maybeRelocatable)) {
      return maybeRelocatable;
    }
    return undefined;
  }
}
