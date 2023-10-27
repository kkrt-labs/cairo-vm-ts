import { test, expect, describe } from 'bun:test';
import { None, NoneError, Some } from './option';
import { Err, Ok } from 'result-pattern/result';

describe('Option', () => {
  describe('isSome', () => {
    test('should return true for Some', () => {
      const some = new Some(10);
      expect(some.isSome()).toBeTrue();
    });
    test('should return false for None', () => {
      const none = new None();
      expect(none.isSome()).toBeFalse();
    });
  });

  describe('isNone', () => {
    test('should return false for Some', () => {
      const some = new Some(10);
      expect(some.isNone()).toBeFalse();
    });
    test('should return true for None', () => {
      const none = new None();
      expect(none.isNone()).toBeTrue();
    });
  });

  describe('unwrap', () => {
    test('should return the inner value', () => {
      const some = new Some(10);
      expect(some.unwrap()).toEqual(10);
    });
    test('should throw NoneError', () => {
      const none = new None();
      expect(() => none.unwrap()).toThrow(
        new NoneError('Attempted to unwrap a None value')
      );
    });
  });

  describe('ok', () => {
    test('should return a Result::Ok', () => {
      const some = new Some(10);
      expect(some.ok()).toEqual(new Ok(10));
    });
    test('should return a Result::Err', () => {
      const none = new None();
      expect(none.ok()).toEqual(new Err(new NoneError('Option is none')));
    });
  });
});
