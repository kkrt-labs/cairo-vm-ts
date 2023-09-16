import { test, expect, describe } from 'bun:test';
import {
  Relocatable,
  OffsetUnderflow,
  SegmentError,
  ForbiddenOperation,
} from './relocatable';

describe('relocatable', () => {
  test('should initialise a relocatable correctly', () => {
    const reloc = new Relocatable(1, 10);

    expect(reloc.getSegmentIndex()).toEqual(1);
    expect(reloc.getOffset()).toEqual(10);
  });

  test('should throw ForbiddenOperation when adding', () => {
    const a = new Relocatable(1, 100);
    const b = new Relocatable(2, 200);
    try {
      a.add(b);
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenOperation);
    }
  });

  test('should sub two relocatables with same segment properly', () => {
    const a = new Relocatable(1, 300);
    const b = new Relocatable(1, 200);
    const c = a.sub(b);
    expect(c.getSegmentIndex()).toEqual(1);
    expect(c.getOffset()).toEqual(100);
  });

  test('should throw OffsetUnderflow error', () => {
    const a = new Relocatable(1, 200);
    const b = new Relocatable(1, 300);
    try {
      a.sub(b);
    } catch (err) {
      expect(err).toBeInstanceOf(OffsetUnderflow);
    }
  });

  test('should throw SegmentError on different segment subtraction', () => {
    const a = new Relocatable(1, 100);
    const b = new Relocatable(2, 50);
    try {
      a.sub(b);
    } catch (err) {
      expect(err).toBeInstanceOf(SegmentError);
    }
  });
});
