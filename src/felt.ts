class FeltError extends Error {}

class Felt {
  // TODO: should check for PRIME overflow.
  // TODO: put private to make sure nothing is broken once this is added
  private inner: bigint;
  constructor(_inner: bigint) {
    this.inner = _inner;
  }

  add(other: MaybeRelocatable): MaybeRelocatable {
    if (other instanceof Relocatable) throw new NotImplementedError();
    return new Felt(this.inner + other.inner);
  }

  sub(other: MaybeRelocatable): MaybeRelocatable {
    if (other instanceof Relocatable) throw new NotImplementedError();
    return new Felt(this.inner - other.inner);
  }

  toString() {
    return this.inner.toString();
  }

  toNumber() {
    return Number(this.inner);
  }

  toHexString() {
    return this.inner.toString(16);
  }
}
