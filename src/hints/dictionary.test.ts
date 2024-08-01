import { describe, test, expect } from 'bun:test';

import { DictNotFound } from 'errors/dictionary';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { VirtualMachine } from 'vm/virtualMachine';
import { Dictionary } from './dictionary';

describe('Dictionary', () => {
  test('should properly initialize the dict manager', () => {
    const vm = new VirtualMachine();
    expect(vm.dictManager.size).toEqual(0);
  });

  test('should properly create a new dictionary', () => {
    const vm = new VirtualMachine();
    const address = vm.newDict();
    expect(address).toEqual(new Relocatable(0, 0));
    expect(vm.getDict(address)).toEqual(new Dictionary(new Felt(0n)));
  });

  test('should throw DictNotFound when accessing a non-existing dictionary', () => {
    const vm = new VirtualMachine();
    const address = new Relocatable(2, 3);
    expect(() => vm.getDict(address)).toThrow(new DictNotFound(address));
  });
});
