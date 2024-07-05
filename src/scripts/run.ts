import * as fs from 'fs';

import { ConsolaInstance, LogLevels } from 'consola';
import { CairoRunner, RunOptions } from 'runners/cairoRunner';
import { parseCairo1Program, parseProgram } from 'vm/program';
import { TraceEntry } from 'vm/virtualMachine';

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
      cairo1,
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

    if (
      (!relocate && !!offset) ||
      (!relocate && exportMemory) ||
      (!relocate && printRelocatedMemory)
    ) {
      consola.log(
        "option '--no-relocate' cannot be used with options '--offset <OFFSET>', '--export-memory <MEMORY_FILENAME>' or '--print-relocated-memory'"
      );
      process.exit(1);
    }

    consola.info(`Cairo VM TS ${version} - Execution Mode`);

    const file = fs.readFileSync(String(path), 'utf-8');

    if (cairo1) {
      const program = parseCairo1Program(file);
      runner = CairoRunner.fromCairoProgram(program);
    } else {
      const program = parseProgram(file);
      runner = CairoRunner.fromCairoZeroProgram(program);
    }
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
