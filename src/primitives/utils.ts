export function nextPowerOfTwo(n: number): number {
  return 1 << Math.ceil(Math.log2(n));
}
