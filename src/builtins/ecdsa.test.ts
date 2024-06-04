import { describe, expect, test } from 'bun:test';

import { ExpectedFelt } from 'errors/virtualMachine';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { Memory } from 'memory/memory';
import { EcdsaSegment, EcdsaSignature, ecdsaHandler } from './ecdsa';

const DUMMY_SIG: EcdsaSignature = { r: new Felt(0n), s: new Felt(0n) };

describe('ECDSA', () => {
  describe('Signature verification', () => {
    test('Should properly verify a correct signature', () => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(ecdsaHandler);

      const segment = memory.segments[segmentId] as EcdsaSegment;

      const signature: EcdsaSignature = {
        r: new Felt(
          3086480810278599376317923499561306189851900463386393948998357832163236918254n
        ),
        s: new Felt(
          598673427589502599949712887611119751108407514580626464031881322743364689811n
        ),
      };

      const pubKeyAddr = new Relocatable(segmentId, 0);
      const msgAddr = new Relocatable(segmentId, 1);

      const pubKey = new Felt(
        1735102664668487605176656616876767369909409133946409161569774794110049207117n
      );
      const msg = new Felt(2718n);

      segment.signatures[pubKeyAddr.offset] = signature;
      memory.assertEq(pubKeyAddr, pubKey);
      memory.assertEq(msgAddr, msg);

      expect(memory.get(msgAddr)).toEqual(msg);
    });

    test('Should properly throw when signature is invalid', () => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(ecdsaHandler);

      const segment = memory.segments[segmentId] as EcdsaSegment;

      const signature = DUMMY_SIG;

      const pubKeyAddr = new Relocatable(segmentId, 0);
      const msgAddr = new Relocatable(segmentId, 1);

      const pubKey = new Felt(14n);
      const msg = new Felt(2718n);

      segment.signatures[pubKeyAddr.offset] = signature;
      memory.assertEq(pubKeyAddr, pubKey);
      expect(() => memory.assertEq(msgAddr, msg)).toThrow();
    });
  });

  describe('signatureHandler', () => {
    test('should properly update the signature array', () => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(ecdsaHandler);
      const segment = memory.segments[segmentId] as EcdsaSegment;

      const signature: EcdsaSignature = {
        r: new Felt(10n),
        s: new Felt(15n),
      };

      const address = new Relocatable(segmentId, 2);
      segment.signatures[address.offset] = signature;

      expect(segment.signatures[address.offset]).toEqual(signature);
    });

    test('should throw when adding a signature which is not the expected object', () => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(ecdsaHandler);
      const segment = memory.segments[segmentId] as EcdsaSegment;

      segment.signatures[2] = { r: new Felt(0n), s: new Felt(0n) };
      // @ts-expect-error
      expect(() => (segment.signatures[4] = 12)).toThrow(new ExpectedFelt());
    });

    test('should throw when trying to add a signature with a key which is not a number', () => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(ecdsaHandler);
      const segment = memory.segments[segmentId] as EcdsaSegment;
      const signature: EcdsaSignature = { r: new Felt(0n), s: new Felt(0n) };
      // @ts-expect-error
      expect(() => (segment.signatures['az'] = signature)).toThrow();
    });

    test('Should not update a signature array for another ProxyHandler', () => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment();
      const segment = memory.segments[segmentId] as EcdsaSegment;
      const signature: EcdsaSignature = { r: new Felt(0n), s: new Felt(0n) };
      expect(() => (segment.signatures[3] = signature)).toThrow();
    });
  });
});
