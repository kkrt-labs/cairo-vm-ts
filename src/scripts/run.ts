import * as fs from 'fs';

import { ConsolaInstance, LogLevels } from 'consola';

import { TraceEntry } from 'vm/virtualMachine';
import { parseProgram } from 'vm/program';
import { CairoRunner, RunOptions } from 'runners/cairoRunner';
import { ALL_LAYOUTS } from 'runners/layout';

export const run = (
  path: string,
  options: any,
  consola: ConsolaInstance,
  version: string
) => {
  let runner: CairoRunner | undefined = undefined;
  try {
    const {
      silent,
      layout,
      fn,
      relocate,
      offset,
      exportMemory,
      exportTrace,
      printOutput,
      printMemory,
      printRelocatedMemory,
      printTrace,
    } = options;

    if (silent) consola.level = LogLevels.silent;

    if (ALL_LAYOUTS.findIndex((name) => layout == name) === -1) {
      consola.error(
        `Layout "${layout}" is not a valid layout.
Use one from {${ALL_LAYOUTS.join(', ')}}`
      );
      process.exit(1);
    }

    if (
      (!relocate && !!offset) ||
      (!relocate && exportMemory) ||
      (!relocate && printRelocatedMemory)
    ) {
      consola.error(
        "option '--no-relocate' cannot be used with options '--offset <OFFSET>', '--export-memory <MEMORY_FILENAME>' or '--print-relocated-memory'"
      );
      process.exit(1);
    }

    consola.info(`Cairo VM TS ${version} - Execution Mode`);

    const file = fs.readFileSync(String(path), 'utf-8');

    const program = parseProgram(file);
    runner = CairoRunner.fromProgram(program, layout, fn);
    const config: RunOptions = { relocate: relocate, offset: offset };
    runner.run(config);
    consola.success('Execution finished!');

    if (exportMemory) {
      consola.info('Exporting memory...');
      runner.exportMemory(exportMemory);
      consola.success(`Memory exported to ${exportMemory}`);
    }
    if (exportTrace) {
      consola.info('Exporting trace...');
      runner.exportTrace(exportTrace);
      consola.success(`Trace exported to ${exportTrace}`);
    }

    if (printMemory) consola.log(runner.vm.memory.toString());
    if (printRelocatedMemory) consola.log(runner.vm.relocatedMemoryToString());
    if (printTrace)
      consola.log(
        '\nTRACE:',
        runner.vm.trace
          .map((entry: TraceEntry, index: number) =>
            [
              `\nSTEP: ${index}`,
              `pc: ${entry.pc.toString()}`,
              `ap: ${entry.ap.toString()}`,
              `fp: ${entry.fp.toString()}\n`,
            ].join('\n')
          )
          .join('\n')
      );
    if (printOutput) {
      const output = runner.getOutput();
      if (output.length) {
        consola.log('Program output: ');
        output.forEach((value) => consola.log(value.toString()));
      } else {
        consola.log('Output segment is empty');
      }
    }
  } catch (err) {
    consola.fail(`Execution failed`);
    if (runner) console.log(runner.vm.memory.toString());
    throw err;
  }
};
