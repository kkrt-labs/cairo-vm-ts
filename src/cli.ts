#! /usr/bin/env bun

import * as fs from 'fs';
import { Command, Option } from '@commander-js/extra-typings';

import { consola } from 'consola';
import { parseProgram } from 'vm/program';
import { CairoRunner, RunOptions } from 'runners/cairoRunner';
import { TraceEntry } from 'vm/virtualMachine';
import { Argument } from 'commander';

consola.options = {
  ...consola.options,
  formatOptions: {
    date: false,
  },
};

const VERSION_CLI = '0.1.0';

const program = new Command().name('cairo-vm-ts').version(VERSION_CLI);

program
  .command('run', { isDefault: true })
  .description('Run a compiled Cairo program')
  .addArgument(
    new Argument(
      '<program.json>',
      'path to Cairo compilation artifacts'
    ).argParser((path) => {
      if (!path.match(/\.json$/))
        throw new Error('Provided file is not a JSON');
      return path;
    })
  )
  .option('--no-relocate', 'do not relocate memory')
  .addOption(
    new Option(
      '--offset <OFFSET>',
      'start address of the relocated memory\nStarkWare verifier expects offset to be 1'
    )
      .default(0, '0')
      .argParser(parseInt)
  )
  .option(
    '--export-trace <TRACE_FILENAME>',
    'export the trace, little-endian encoded'
  )
  .option(
    '--export-memory <MEMORY_FILENAME>',
    'export the relocated memory, little-endian encoded'
  )
  .option('--print-trace', 'print the trace')
  .option('--print-memory', 'print the non-relocated memory')
  .option('--print-relocated-memory', 'print the relocated memory')
  .option('--print-output', 'print the output segment')
  .action(async (path, options) => {
    const {
      relocate,
      offset,
      exportMemory,
      exportTrace,
      printOutput,
      printMemory,
      printRelocatedMemory,
      printTrace,
    } = options;

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

    consola.info(`Cairo VM TS ${VERSION_CLI} - Execution Mode`);

    const program = parseProgram(fs.readFileSync(String(path), 'utf-8'));
    const runner = new CairoRunner(program);
    const config: RunOptions = {
      relocate: relocate,
      relocateOffset: offset,
    };
    try {
      runner.run(config);
    } catch (err) {
      consola.fail('Execution failed!');
      throw err;
    }
    consola.success('Execution finished!');

    if (exportMemory) {
      consola.info('Exporting memory...');
      try {
        runner.exportMemory(exportMemory, offset);
      } catch (err) {
        consola.fail(
          `Failed to export memory to ${exportMemory} with offset ${offset}`
        );
        consola.error(err);
        process.exit(1);
      }
      consola.success(`Memory exported to ${exportMemory}`);
    }
    if (exportTrace) {
      consola.info('Exporting trace...');
      try {
        runner.exportTrace(exportTrace);
      } catch (err) {
        consola.fail(`Failed to export trace to ${exportTrace}`);
        throw err;
      }
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
  });

program.addHelpText(
  'beforeAll',
  '\nGitHub: https://github.com/kkrt-labs/cairo-vm-ts\nTelegram: https://t.me/cairovmts\n'
);
program.showHelpAfterError();
program.parse();
