import { describe, expect, test } from 'bun:test';
import { Memory } from 'memory/memory';
import { Felt } from 'primitives/felt';
import { ecOpHandler } from './ecop';
import { Relocatable } from 'primitives/relocatable';

describe('EcOp', () => {
  test('Should correctly compute R = P + 34Q', () => {
    const px = new Felt(
      0x6a4beaef5a93425b973179cdba0c9d42f30e01a5f1e2db73da0884b8d6756fcn
    );
    const py = new Felt(
      0x72565ec81bc09ff53fbfad99324a92aa5b39fb58267e395e8abe36290ebf24fn
    );

    const qx = new Felt(
      0x654fd7e67a123dd13868093b3b7777f1ffef596c2e324f25ceaf9146698482cn
    );
    const qy = new Felt(
      0x4fad269cbf860980e38768fe9cb6b0b9ab03ee3fe84cfde2eccce597c874fd8n
    );
    const m = new Felt(34n);

    const memory = new Memory();
    const { segmentId } = memory.addSegment(ecOpHandler);

    const addressPx = new Relocatable(segmentId, 0);
    const addressPy = new Relocatable(segmentId, 1);
    const addressQx = new Relocatable(segmentId, 2);
    const addressQy = new Relocatable(segmentId, 3);
    const addressM = new Relocatable(segmentId, 4);

    memory.assertEq(addressPx, px);
    memory.assertEq(addressPy, py);
    memory.assertEq(addressQx, qx);
    memory.assertEq(addressQy, qy);
    memory.assertEq(addressM, m);

    const addressRx = new Relocatable(segmentId, 5);
    const addressRy = new Relocatable(segmentId, 6);
    const expectedRx = new Felt(
      108925483682366235368969256555281508851459278989259552980345066351008608800n
    );
    const expectedRy = new Felt(
      1592365885972480102953613056006596671718206128324372995731808913669237079419n
    );

    const rx = memory.get(addressRx);
    expect(rx).toEqual(expectedRx);

    const ry = memory.get(addressRy);
    expect(ry).toEqual(expectedRy);
  });

  test('Should throw if a coordinate of a point input value is undefined', () => {
    const px = new Felt(10n);
    const memory = new Memory();
    const { segmentId } = memory.addSegment(ecOpHandler);

    const addressPx = new Relocatable(segmentId, 0);
    const addressRx = new Relocatable(segmentId, 5);
    memory.assertEq(addressPx, px);

    expect(() => memory.get(addressRx)).toThrow(
      'Invalid field element: expected bigint, got undefined'
    );
  });

  test('Should throw if scalar is undefined', () => {
    const px = new Felt(10n);
    const py = new Felt(5n);
    const qx = new Felt(3n);
    const qy = new Felt(2n);

    const memory = new Memory();
    const { segmentId } = memory.addSegment(ecOpHandler);

    const addressPx = new Relocatable(segmentId, 0);
    const addressPy = new Relocatable(segmentId, 1);
    const addressQx = new Relocatable(segmentId, 2);
    const addressQy = new Relocatable(segmentId, 3);

    memory.assertEq(addressPx, px);
    memory.assertEq(addressPy, py);
    memory.assertEq(addressQx, qx);
    memory.assertEq(addressQy, qy);

    const addressRx = new Relocatable(segmentId, 5);
    memory.assertEq(addressPx, px);

    expect(() => memory.get(addressRx)).toThrow(
      'Expected valid bigint: 0 < bigint < curve.n'
    );
  });
});
