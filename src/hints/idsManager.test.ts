import { describe, expect, test } from 'bun:test';

import { UndefinedVariable } from 'errors/idsManager';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { VirtualMachine } from 'vm/virtualMachine';
import { ApTrackingData } from 'vm/program';

import { HintReference } from './hintReference';
import { IdsManager } from './idsManager';

const AP_TRACKING_DATA_DEFAULT: ApTrackingData = { group: 0, offset: 0 };

describe('IdsManager', () => {
  describe('get', () => {
    test('get simple reference value with no dereference', () => {
      const ids = new IdsManager(
        new Map<string, HintReference>([
          [
            'value',
            HintReference.parseReference({
              pc: 0,
              ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
              value: 'cast(fp, felt)',
            }),
          ],
        ]),
        AP_TRACKING_DATA_DEFAULT
      );
      const vm = new VirtualMachine();
      expect(ids.get('value', vm)).toEqual(vm.fp);
    });

    test('get simple reference value dereferenced', () => {
      const ids = new IdsManager(
        new Map<string, HintReference>([
          [
            'value',
            HintReference.parseReference({
              pc: 0,
              ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
              value: '[cast(fp, felt)]',
            }),
          ],
        ]),
        AP_TRACKING_DATA_DEFAULT
      );
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      const value = new Felt(3n);
      vm.memory.assertEq(vm.fp, value);
      expect(ids.get('value', vm)).toEqual(value);
    });

    test.each([
      ['cast(42, felt)', new Felt(42n)],
      ['cast(-42, felt)', new Felt(-42n)],
    ])('get immediate', (value: string, expectedValue: Felt) => {
      const ids = new IdsManager(
        new Map<string, HintReference>([
          [
            'value',
            HintReference.parseReference({
              pc: 0,
              ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
              value: value,
            }),
          ],
        ]),
        AP_TRACKING_DATA_DEFAULT
      );
      const vm = new VirtualMachine();
      expect(ids.get('value', vm)).toEqual(expectedValue);
    });

    test('get reference value with ap tracking correction', () => {
      const ids = new IdsManager(
        new Map<string, HintReference>([
          [
            'value',
            HintReference.parseReference({
              pc: 0,
              ap_tracking_data: { group: 1, offset: 2 },
              value: 'cast(ap, felt)',
            }),
          ],
        ]),
        { group: 1, offset: 5 }
      );
      const vm = new VirtualMachine();
      vm.ap = new Relocatable(1, 5);
      expect(ids.get('value', vm)).toEqual(new Relocatable(1, 2));
    });

    test('get reference from complex expression with two dereference', () => {
      const ids = new IdsManager(
        new Map<string, HintReference>([
          [
            'value',
            HintReference.parseReference({
              pc: 0,
              ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
              value: 'cast([ap + 1] + [fp + (-2)], felt)',
            }),
          ],
        ]),
        AP_TRACKING_DATA_DEFAULT
      );
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      vm.fp = new Relocatable(1, 5);
      vm.memory.assertEq(vm.ap.add(1), new Relocatable(0, 1));
      vm.memory.assertEq(vm.fp.sub(2), new Felt(2n));
      expect(ids.get('value', vm)).toEqual(new Relocatable(0, 3));
    });

    test('get reference from complex expression with one dereference', () => {
      const ids = new IdsManager(
        new Map<string, HintReference>([
          [
            'value',
            HintReference.parseReference({
              pc: 0,
              ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
              value: 'cast([fp + 1] + (-2), felt)',
            }),
          ],
        ]),
        AP_TRACKING_DATA_DEFAULT
      );
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      vm.memory.assertEq(vm.fp.add(1), new Relocatable(0, 4));
      expect(ids.get('value', vm)).toEqual(new Relocatable(0, 2));
    });

    test('should throw when trying to get an unknown variable', () => {
      const ids = new IdsManager(
        new Map<string, HintReference>([
          [
            'value',
            HintReference.parseReference({
              pc: 0,
              ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
              value: 'cast(fp, felt)',
            }),
          ],
        ]),
        AP_TRACKING_DATA_DEFAULT
      );
      const vm = new VirtualMachine();
      vm.ap = new Relocatable(1, 5);
      expect(() => ids.get('val', vm)).toThrow(new UndefinedVariable('val'));
    });
  });

  describe('getConst', () => {
    test('should retrieve the const UPPER_BOUND', () => {
      const ids = new IdsManager(
        new Map<string, HintReference>(),
        AP_TRACKING_DATA_DEFAULT,
        [
          'starkware.cairo.common.math',
          'starkware.cairo.common.math.assert_250_bit',
        ]
      );
      const upperBound = new Felt(250n);
      const constants = new Map<string, Felt>([
        ['starkware.cairo.common.math.assert_250_bit.UPPER_BOUND', upperBound],
      ]);

      expect(ids.getConst('UPPER_BOUND', constants)).toEqual(upperBound);
    });
  });
});
