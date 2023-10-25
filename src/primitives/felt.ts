import { NumberConversionError, Uint32, Uint64, UnsignedInteger } from './uint';
import { MaybeRelocatable } from './relocatable';

export class FeltError extends Error {}

export const ForbiddenOperation = 'Felt: forbidden operation';

export class Felt {
  private inner: bigint;
  static PRIME: bigint =
    0x800000000000011000000000000000000000000000000000000000000000001n;
  constructor(_inner: bigint) {
    if (_inner < 0n || _inner > Felt.PRIME) {
      throw new FeltError(
        'FeltError: cannot initialize a Felt with underlying bigint negative, or greater than Felt.PRIME'
      );
    }
    this.inner = _inner;
  }

  add(other: MaybeRelocatable): Felt {
    if (other instanceof Felt) {
      return new Felt((this.inner + other.inner) % Felt.PRIME);
    }
    throw new FeltError(ForbiddenOperation);
  }

  sub(other: MaybeRelocatable): Felt {
    if (other instanceof Felt) {
      let result = this.inner - other.inner;
      if (result < 0n) {
        result += Felt.PRIME;
      }
      return new Felt(result);
    }
    throw new FeltError(ForbiddenOperation);
  }

  eq(other: Felt): boolean {
    return this.inner == other.inner;
  }

  toString(): string {
    return this.inner.toString();
  }

  toUint32(): Uint32 {
    if (this.inner > Number.MAX_SAFE_INTEGER) {
      throw new FeltError(NumberConversionError);
    }
    return UnsignedInteger.toUint32(Number(this.inner));
  }

  toUint64(): Uint64 {
    return UnsignedInteger.toUint64(this.inner);
  }

  toHexString(): string {
    return this.inner.toString(16);
  }
}
