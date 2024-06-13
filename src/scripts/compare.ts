#! /usr/bin/env bun

import { Felt } from 'primitives/felt';
import { RelocatedTraceEntry } from 'vm/virtualMachine';

export const compareTrace = async (paths: string[]) => {
  return await Promise.all(
    paths.map((path) => Bun.file(path).arrayBuffer())
  ).then((buffers) => {
    let failed = false;
    buffers.reduce((prevBuffer, buffer, index) => {
      if (index && prevBuffer.byteLength !== buffer.byteLength)
        throw new Error(
          `${paths[index - 1]} & ${paths[index]} have different byte lengths`
        );
      return buffer;
    });

    buffers
      .map((buffer) => readTraceBuffer(buffer))
      .reduce((prevTrace, trace, index) => {
        if (index) {
          Object.entries(prevTrace).map(([step, entry]) => {
            if (
              !entry.ap.eq(trace[Number(step)].ap) ||
              !entry.fp.eq(trace[Number(step)].fp) ||
              !entry.pc.eq(trace[Number(step)].pc)
            ) {
              console.error(
                `${paths[index - 1]} & ${
                  paths[index]
                } differ at address ${step}: ${entry} != ${trace[Number(step)]}`
              );
              failed = false;
            }
          });
        }
        return trace;
      });
    return failed;
  });
};

const readTraceBuffer = (buffer: ArrayBuffer) => {
  if (buffer.byteLength % 24 !== 0)
    throw new Error('Memory file is not made of chunks of 40 bytes');
  const view = new DataView(buffer);
  const trace: RelocatedTraceEntry[] = [];

  for (let offset = 0; offset < buffer.byteLength; offset += 24) {
    const step = offset - 40;
    const ap = new Felt(BigInt(view.getUint8(offset)));
    const fp = new Felt(BigInt(view.getUint8(offset + 1 * 8)));
    const pc = new Felt(BigInt(view.getUint8(offset + 2 * 8)));
    trace[step] = { pc, ap, fp };
  }
  return trace;
};

export const compareMemory = async (paths: string[]) => {
  return await Promise.all(
    paths.map((path) => Bun.file(path).arrayBuffer())
  ).then((buffers) => {
    let failed = false;
    buffers.reduce((prevBuffer, buffer, index) => {
      if (index && prevBuffer.byteLength !== buffer.byteLength)
        throw new Error(
          `${paths[index - 1]} & ${paths[index]} have different byte lengths`
        );
      return buffer;
    });

    buffers
      .map((buffer) => readMemoryBuffer(buffer))
      .reduce((prevMemory, memory, index) => {
        if (index) {
          Object.entries(prevMemory).map(([address, value]) => {
            if (!value.eq(memory[address])) {
              console.error(
                `${paths[index - 1]} & ${
                  paths[index]
                } differ at address ${address}: ${value} != ${memory[address]}`
              );
              failed = false;
            }
          });
        }
        return memory;
      });
    return failed;
  });
};

const readMemoryBuffer = (buffer: ArrayBuffer) => {
  if (buffer.byteLength % 40 !== 0)
    throw new Error('Memory file is not made of chunks of 40 bytes');
  const view = new DataView(buffer);
  const memory: { [key: string]: Felt } = {};

  for (let offset = 0; offset < buffer.byteLength; offset += 40) {
    const address = view.getBigUint64(offset, true).toString();
    const valueAs64BitsWords = [
      view.getBigUint64(offset + 8, true),
      view.getBigUint64(offset + 2 * 8, true),
      view.getBigUint64(offset + 3 * 8, true),
      view.getBigUint64(offset + 4 * 8, true),
    ];
    memory[address] = Felt.from64BitsWords(valueAs64BitsWords);
  }
  return memory;
};
