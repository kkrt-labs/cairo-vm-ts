import { test, expect, describe } from 'bun:test';
import { Result, UnwrapError } from './result';
import { FeltError } from 'primitives/felt';

describe('Result', () => {
  describe('success', () => {
    test('should create a successful result', () => {
      const result = Result.ok(42);
      expect(result.isOk()).toBeTrue();
      expect(result.unwrapOrUndefined()).toEqual(42);
    });
  });

  describe('error', () => {
    test('should create an error result', () => {
      const error = new FeltError();
      const result = Result.error(error);
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErrOrUndefined()).toBe(error);
    });
  });

  describe('isOk', () => {
    test('should correctly identify a successful result', () => {
      const result = Result.ok('success');
      expect(result.isOk()).toBeTrue();
    });

    test('should correctly identify an error result', () => {
      const result = Result.error(new FeltError());
      expect(result.isOk()).toBeFalse();
    });
  });

  describe('isErr', () => {
    test('should correctly identify an error result', () => {
      const result = Result.error(new FeltError());
      expect(result.isErr()).toBeTrue();
    });

    test('should correctly identify a successful result', () => {
      const result = Result.ok('success');
      expect(result.isErr()).toBeFalse();
    });
  });

  describe('unwrapOrUndefined', () => {
    test('should unwrap a successful result value', () => {
      const result = Result.ok(123);
      expect(result.unwrapOrUndefined()).toEqual(123);
    });

    test('should return undefined for an error result', () => {
      const result = Result.error(new FeltError());
      expect(result.unwrapOrUndefined()).toBeUndefined();
    });
  });

  describe('unwrapErrOrUndefined', () => {
    test('should unwrap an error result value', () => {
      const error = new FeltError();
      const result = Result.error(error);
      expect(result.unwrapErrOrUndefined()).toBe(error);
    });

    test('should return undefined for a successful result', () => {
      const result = Result.ok(123);
      expect(result.unwrapErrOrUndefined()).toBeUndefined();
    });
  });

  describe('unwrap', () => {
    test('should unwrap a successful result value', () => {
      const result = Result.ok(123);
      expect(result.unwrap()).toEqual(123);
    });

    test('should throw an error for an error result', () => {
      const result = Result.error(new FeltError());
      expect(() => result.unwrap()).toThrow(new UnwrapError());
    });
  });

  describe('unwrapErr', () => {
    test('should unwrap an error result value', () => {
      const error = new FeltError();
      const result = Result.error(error);
      expect(result.unwrapErr()).toBe(error);
    });

    test('should throw an error for a successful result', () => {
      const result = Result.ok(123);
      expect(() => result.unwrapErr()).toThrow(new UnwrapError());
    });
  });
});
