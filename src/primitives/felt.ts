import { Result, Err, Ok, VMError } from 'result-pattern/result';
import { Uint, UnsignedInteger } from './uint';

export class FeltError extends Error {}

export const ConversionError = {
  message:
    'FeltError: cannot convert to Felt to Number, as underlying bigint > Number.MAX_SAFE_INTEGER or < 0',
};

export class Felt {
  // TODO: should check for PRIME overflow.
  // TODO: put private to make sure nothing is broken once this is added
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

  add(other: Felt): Felt {
    return new Felt((this.inner + other.inner) % Felt.PRIME);
  }

  sub(other: Felt): Felt {
    let result = this.inner - other.inner;
    if (result < 0n) {
      result += Felt.PRIME;
    }
    return new Felt(result);
  }

  eq(other: Felt): boolean {
    return this.inner == other.inner;
  }

  toString(): string {
    return this.inner.toString();
  }

  toUint(): Result<Uint, VMError> {
    const num = Number(this.inner);

    // The value of the largest integer n such that n and n + 1 are both exactly representable as a Number value.
    // The value of Number.MAX_SAFE_INTEGER is 9007199254740991, i.e. 2^53 − 1.
    if (num > Number.MAX_SAFE_INTEGER || num < 0) {
      return new Err(ConversionError);
    }

    return new Ok(UnsignedInteger.toUint(num));
  }

  toHexString(): string {
    return this.inner.toString(16);
  }
}
