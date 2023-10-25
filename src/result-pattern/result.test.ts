import { test, expect, describe } from 'bun:test';
import { Err, Ok, VMError } from './result';
import { FeltError } from 'primitives/felt';

describe('Result', () => {
  describe('success', () => {
    test('should create a successful result', () => {
      const result = new Ok(42);
      expect(result.isOk()).toBeTrue();
      expect(result.unwrap()).toEqual(42);
    });
  });

  describe('error', () => {
    test('should create an error result', () => {
      const error = new FeltError();
      const result = new Err(error);
      expect(result.isErr()).toBeTrue();
      expect(result.unwrapErr()).toBe(error);
    });
  });

  describe('isOk', () => {
    test('should correctly identify a successful result', () => {
      const result = new Ok('success');
      expect(result.isOk()).toBeTrue();
    });

    test('should correctly identify an error result', () => {
      const result = new Err(new FeltError());
      expect(result.isOk()).toBeFalse();
    });
  });

  describe('isErr', () => {
    test('should correctly identify an error result', () => {
      const result = new Err(new FeltError());
      expect(result.isErr()).toBeTrue();
    });

    test('should correctly identify a successful result', () => {
      const result = new Ok('success');
      expect(result.isErr()).toBeFalse();
    });
  });

  describe('unwrap', () => {
    test('should unwrap a successful result value', () => {
      const result = new Ok(123);
      expect(result.unwrap()).toEqual(123);
    });
  });

  describe('unwrapErr', () => {
    test('should unwrap an error result value', () => {
      const error = new FeltError();
      const result = new Err(error);
      expect(result.unwrapErr()).toBe(error);
    });
  });
  describe('composeErrors', () => {
    test('should concatenate multiple error messages', () => {
      const errors: VMError[] = [
        { message: 'First error.' },
        { message: 'Second error.' },
      ];

      const result = Err.composeErrors(errors);
      expect(result.message).toEqual('First error. \n Second error. \n ');
    });

    test('should return empty string for no errors', () => {
      const errors: VMError[] = [];
      const result = Err.composeErrors(errors);
      expect(result.message).toEqual('');
    });
  });
});
