import { describe, expect, test } from 'bun:test';

import { UnknownHint } from 'errors/hint';
import { ApTrackingData } from 'vm/program';

import { HintProcessor } from './hint';

const AP_TRACKING_DATA_DEFAULT: ApTrackingData = {
  group: 0,
  offset: 0,
};

describe('Hints', () => {
  describe('hint code', () => {
    test('should throw UnknownHint when executing a non-existing hint', () => {
      expect(() =>
        new HintProcessor().execute({
          accessible_scopes: [],
          flow_tracking_data: {
            ap_tracking: AP_TRACKING_DATA_DEFAULT,
            reference_ids: new Map<string, number>(),
          },
          code: 'no-code',
        })
      ).toThrow(new UnknownHint('no-code'));
    });
  });
});
