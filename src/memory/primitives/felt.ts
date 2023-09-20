export class FeltError extends Error {}
export class ConversionError extends FeltError {
  constructor(
    message = 'Failed to convert BigInt to Number due to size limitations.'
  ) {
    super(message);
  }
}

export class Felt {
  // TODO: should check for PRIME overflow.
  // TODO: put private to make sure nothing is broken once this is added
  private inner: bigint;
  static PRIME: bigint =
    0x800000000000011000000000000000000000000000000000000000000000001n;
  constructor(_inner: bigint) {
    if (_inner < 0n || _inner > Felt.PRIME) {
      throw new FeltError();
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

  //
  _getInner(): BigInt {
    return this.inner;
  }

  eq(other: Felt): boolean {
    return this.inner == other._getInner();
  }

  toString(): string {
    return this.inner.toString();
  }

  toNumber(): number {
    let num = Number(this.inner);
    // The value of the largest integer n such that n and n + 1 are both exactly representable as a Number value.
    // The value of Number.MAX_SAFE_INTEGER is 9007199254740991, i.e. 2^53 − 1.
    if (num > Number.MAX_SAFE_INTEGER) {
      throw new ConversionError();
    }
    return num;
  }

  toHexString(): string {
    return this.inner.toString(16);
  }
}
