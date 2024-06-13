import { Felt } from 'primitives/felt';

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
      .map((buffer) => readMemory(buffer))
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

const readMemory = (buffer: ArrayBuffer) => {
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
