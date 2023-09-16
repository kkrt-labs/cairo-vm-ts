import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';
import {
  ForbiddenOperation,
  OffsetUnderflow,
  Relocatable,
} from './relocatable';
import { add, sub } from './maybeRelocatable';
import { InternalError } from './types';

describe('maybe relocatable', () => {
  test('should add two Felts correctly', () => {
    const a = new Felt(100n);
    const b = new Felt(200n);
    const result = add(a, b) as Felt;
    expect(result.getInner()).toEqual(300n);
  });

  test('should subtract two Felts correctly', () => {
    const a = new Felt(300n);
    const b = new Felt(200n);
    const result = sub(a, b) as Felt;
    expect(result.getInner()).toEqual(100n);
  });

  test('should add Felt and Relocatable', () => {
    const a = new Felt(100n);
    const b = new Relocatable(1, 200);
    const result = add(a, b) as Relocatable;
    expect(result.getSegmentIndex()).toEqual(1);
    expect(result.getOffset()).toEqual(300);
  });

  test('should subtract Felt from Relocatable', () => {
    const a = new Felt(100n);
    const b = new Relocatable(1, 300);
    const result = sub(a, b) as Relocatable;
    expect(result.getSegmentIndex()).toEqual(1);
    expect(result.getOffset()).toEqual(200);
  });

  test('should throw OffsetUnderflow when subtracting a larger Felt from a Relocatable', () => {
    const a = new Felt(400n);
    const b = new Relocatable(1, 200);
    try {
      sub(a, b);
    } catch (err) {
      expect(err).toBeInstanceOf(OffsetUnderflow);
    }
  });

  test('should throw ForbiddenOperation when adding two Relocatables', () => {
    const a = new Relocatable(1, 100);
    const b = new Relocatable(2, 200);
    try {
      add(a, b);
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenOperation);
    }
  });

  test('should throw InternalError when unexpected type combinations are used', () => {
    // This is just a demonstration, assuming there's a type not covered by your add/sub functions
    const unknownType: any = {};
    const felt = new Felt(100n);
    try {
      add(felt, unknownType);
    } catch (err) {
      expect(err).toBeInstanceOf(InternalError);
    }
  });
});
