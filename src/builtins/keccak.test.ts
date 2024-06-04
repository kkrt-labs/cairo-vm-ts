import { describe, expect, test } from 'bun:test';
import { Memory } from 'memory/memory';
import { keccakHandler } from './keccak';
import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';

const KECCAK_VALUES = [
  {
    initialState: [
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
    ],
    expectedState: [
      new Felt(0x4dd598261ea65aa9ee84d5ccf933c0478af1258f7940e1dde7n),
      new Felt(0x47c4ff97a42d7f8e6fd48b284e056253d057bd1547306f8049n),
      new Felt(0x8ffc64ad30a6f71b19059c8c5bda0cd6192e7690fee5a0a446n),
      new Felt(0xdbcf555fa9a6e6260d712103eb5aa93f2317d63530935ab7d0n),
      new Felt(0x5a21d9ae6101f22f1a11a5569f43b831cd0347c82681a57c16n),
      new Felt(0x5a554fd00ecb613670957bc4661164befef28cc970f205e563n),
      new Felt(0x41f924a2c509e4940c7922ae3a26148c3ee88a1ccf32c8b87cn),
      new Felt(0xeaf1ff7b5ceca24975f644e97f30a13b16f53526e70465c218n),
    ],
  },
  {
    initialState: [
      new Felt(1n),
      new Felt(2n),
      new Felt(3n),
      new Felt(4n),
      new Felt(5n),
      new Felt(6n),
      new Felt(7n),
      new Felt(8n),
    ],

    expectedState: [
      new Felt(0x5437ca4807beb9df3871c8467f0c8c2ac42e1f2100e18198f6n),
      new Felt(0x7a753f70755cbbde7882962e5969b2874c2dff11a91716ab31n),
      new Felt(0xe561082c7d6621e7480f773a54870b0dab0ad6151b08ee303an),
      new Felt(0xb744cd390af9518a46a3d88b6003f7393c7ead3f9a131638ben),
      new Felt(0xf16079da5c848e9f6b99afdf72720169e5209e171f8ef7582en),
      new Felt(0xe108fbbcea9d86a6d76f01b63c33ffffd896ad8e2b71026060n),
      new Felt(0x9c7aa8a62187936713012ec096925a78b1c1a140ab7a061ca3n),
      new Felt(0xd5774bd1793a6b3940c0a54888a6a3c1e57251a7e727590b40n),
    ],
  },
];

describe('Keccak', () => {
  // Test pass for input as all 0, but not for other input, still don't know why
  test.each(KECCAK_VALUES)('Should correctly compute keccak state', (value) => {
    const { initialState, expectedState } = value;
    const memory = new Memory();
    const { segmentId } = memory.addSegment(keccakHandler);

    initialState.forEach((input, index) =>
      memory.assertEq(new Relocatable(segmentId, index), input)
    );

    expectedState.forEach((state, index) => {
      const output = memory.get(new Relocatable(segmentId, index + 8));
      expect(output).toEqual(state);
    });
  });
});
