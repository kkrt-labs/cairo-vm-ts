import { test, expect, describe } from 'bun:test';
import { ConversionError, Felt } from './felt';

describe('felt', () => {
  test('should initialise a felt correctly and perform good conversions', () => {
    const felt = new Felt(10n);

    expect(felt.getInner()).toEqual(10n);
    expect(felt.toNumber()).toEqual(10);
    expect(felt.toString()).toEqual('10');
    expect(felt.toHexString()).toEqual('a');
  });

  test('should fail number conversion when felt inner > JS max number', () => {
    // twoPowHundred == 2^100
    const twoPowHundred = 1267650600228229401496703205376n;
    const felt = new Felt(twoPowHundred);
    try {
      felt.toNumber();
    } catch (err) {
      expect(err).toBeInstanceOf(ConversionError);
    }
  });

  test('should add two felts properly', () => {
    const a = new Felt(1000n);
    const b = new Felt(2000n);
    const c = a.add(b);
    expect(c.getInner()).toEqual(3000n);
  });

  test('should sub two felts properly', () => {
    const a = new Felt(3000n);
    const b = new Felt(2000n);
    const c = a.sub(b);
    expect(c.getInner()).toEqual(1000n);
  });
});
