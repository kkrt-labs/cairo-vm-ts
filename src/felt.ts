export class FeltError extends Error {}
export class ConversionError extends Error {}

export class Felt {
  // TODO: should check for PRIME overflow.
  // TODO: put private to make sure nothing is broken once this is added
  private inner: bigint;
  constructor(_inner: bigint) {
    this.inner = _inner;
  }

  add(other: Felt): Felt {
    return new Felt(this.inner + other.inner);
  }

  sub(other: Felt): Felt {
    return new Felt(this.inner - other.inner);
  }

  getInner(): BigInt {
    return this.inner;
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
