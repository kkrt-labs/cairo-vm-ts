import { describe, expect, test } from 'bun:test';

import { UnknownHint, UnreachableReference } from 'errors/hint';
import { ApTrackingData, Hint, ReferenceManager } from 'vm/program';

import { HintData, HintProcessor } from './hint';
import { HintReference, ValueType } from './hintReference';
import { Register } from 'vm/instruction';
import { IdsManager } from './idsManager';

const AP_TRACKING_DATA_DEFAULT: ApTrackingData = {
  group: 0,
  offset: 0,
};

describe('Hints', () => {
  describe('compile', () => {
    test('should correctly compile the given hint', () => {
      const hintProcessor = new HintProcessor();
      const hint: Hint = {
        code: 'ids.a = ids.b',
        flow_tracking_data: {
          ap_tracking: { group: 1, offset: 2 },
          reference_ids: {
            '__main.__.a': 0,
            '__main__.b': 1,
          },
        },
        accessible_scopes: [],
      };
      const refManager: ReferenceManager = {
        references: [
          {
            pc: 0,
            ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
            value: 'cast(ap + (-2), felt)',
          },
          {
            pc: 0,
            ap_tracking_data: AP_TRACKING_DATA_DEFAULT,
            value: 'cast(ap + (-1), felt)',
          },
        ],
      };
      const expectedData: HintData = {
        ids: new IdsManager(
          new Map<string, HintReference>([
            [
              'a',
              {
                valueType: 'felt',
                dereferenced: false,
                apTrackingData: AP_TRACKING_DATA_DEFAULT,
                offset1: {
                  valueType: ValueType.Reference,
                  dereferenced: false,
                  register: Register.Ap,
                  value: -2,
                },
              },
            ],
            [
              'b',
              {
                valueType: 'felt',
                dereferenced: false,
                apTrackingData: AP_TRACKING_DATA_DEFAULT,
                offset1: {
                  valueType: ValueType.Reference,
                  dereferenced: false,
                  register: Register.Ap,
                  value: -1,
                },
              },
            ],
          ]),
          { group: 1, offset: 2 }
        ),
        code: 'ids.a = ids.b',
      };

      const data = hintProcessor.compile(hint, refManager);
      expect(data).toEqual(expectedData);
    });

    test('should throw when compiling a hint with a missing reference', () => {
      const hintProcessor = new HintProcessor();
      const hint: Hint = {
        code: 'ids.a = ids.b',
        flow_tracking_data: {
          ap_tracking: AP_TRACKING_DATA_DEFAULT,
          reference_ids: {
            '__main.__.a': 0,
            '__main__.b': 1,
          },
        },
        accessible_scopes: [],
      };
      const refManager: ReferenceManager = { references: [] };

      expect(() => hintProcessor.compile(hint, refManager)).toThrow(
        new UnreachableReference(0, 0)
      );
    });
  });

  describe('execute', () => {
    test('should throw UnknownHint when executing a non-existing hint', () => {
      expect(() =>
        new HintProcessor().execute({
          accessible_scopes: [],
          flow_tracking_data: {
            ap_tracking: AP_TRACKING_DATA_DEFAULT,
            reference_ids: {},
          },
          code: 'no-code',
        })
      ).toThrow(new UnknownHint('no-code'));
    });
  });
});
