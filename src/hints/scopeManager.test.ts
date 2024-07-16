import { describe, expect, test } from 'bun:test';
import { ScopeManager } from './scopeManager';
import { CannotExitMainScope, VariableNotInScope } from 'errors/scopeManager';
import { Felt } from 'primitives/felt';

describe('ScopeManager', () => {
  test('constructor', () => {
    const scopeManager = new ScopeManager();
    expect(scopeManager.data.length).toEqual(1);
  });

  test('should properly enter a new scope', () => {
    const scopeManager = new ScopeManager();
    scopeManager.enterScope({});
    expect(scopeManager.data.length).toEqual(2);
  });

  test('should properly delete new scopes', () => {
    const scopeManager = new ScopeManager();
    scopeManager.enterScope({});
    scopeManager.enterScope({});
    scopeManager.exitScope();
    expect(scopeManager.data.length).toEqual(2);
  });

  test.each([10, 'a', 4n, new Felt(3n), [1, 2, 3], { a: 3, b: [] }])(
    'should properly set variables',
    (value: any) => {
      const scopeManager = new ScopeManager();
      scopeManager.set('value', value);
      expect(scopeManager.get('value')).toEqual(value);
    }
  );

  test.each([10, 'a', 4n, new Felt(3n), [1, 2, 3], { a: 3, b: [] }])(
    'should properly delete a defined variable',
    (value) => {
      const scopeManager = new ScopeManager();
      expect(() => scopeManager.get('value')).toThrow(
        new VariableNotInScope('value')
      );
      scopeManager.set('value', value);
      expect(() => scopeManager.get('value')).not.toThrow();
      scopeManager.delete('value');
      expect(() => scopeManager.get('value')).toThrow(
        new VariableNotInScope('value')
      );
    }
  );

  test('should throw if trying to delete main scope', () => {
    const scopeManager = new ScopeManager();
    expect(() => scopeManager.exitScope()).toThrow(new CannotExitMainScope());
  });
});
