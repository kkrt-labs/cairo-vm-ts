#! /usr/bin/env bun

import * as fs from 'fs';

import { consola } from 'consola';
import { Command, Option } from '@commander-js/extra-typings';
import figlet from 'figlet';
import { parseProgram } from 'vm/program';
import { CairoRunner, RunOptions } from 'runners/cairoRunner';

consola.options = {
  ...consola.options,
  formatOptions: {
    date: false,
  },
};

const VERSION_CLI = '0.1.0';

const program = new Command().name('cairo-vm-ts').version(VERSION_CLI);

program
  .command('run <program.json>')
  .description('Run a previously compiled Cairo program')
  .version(VERSION_CLI)
  .addOption(
    new Option('--no-relocate', 'do not relocate memory').conflicts([
      '--export-memory',
      '--print-relocate-memory',
    ])
  )
  .addOption(
    new Option(
      '--offset <OFFSET>',
      'start address of the relocated memory\nStarkWare verifier expects offset to be 1'
    )
      .conflicts('--no-relocate')
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
  .option('--print-relocate-memory', 'print the relocated memory')
  .option('--print-output', 'print the output segment')
  .action(async (path, options) => {
    if (!path.match(/\.json/)) throw new Error('Provided file is not a JSON');

    const {
      relocate,
      offset,
      exportMemory,
      exportTrace,
      printOutput,
      printMemory,
      printRelocateMemory,
      printTrace,
    } = options;

    consola.info(`Cairo VM TS ${VERSION_CLI} - Execution Mode`);

    const program = parseProgram(fs.readFileSync(path, 'utf-8'));
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
      runner.exportMemory(exportMemory, offset);
      consola.success(`Memory exported to ${exportMemory}`);
    }
    if (exportTrace) {
      consola.info('Exporting trace...');
      runner.exportTrace(exportTrace);
      consola.success(`Trace exported to ${exportTrace}`);
    }

    if (printMemory) console.log(runner.vm.memory.toString());
    if (printRelocateMemory) console.log(runner.vm.relocatedMemoryToString());
    if (printTrace) console.log(runner.vm.trace.toString());
    if (printOutput) {
      const output = runner.getOutput();
      if (output.length) {
        console.log('Program output: ');
        output.forEach((value) => console.log(value.toString()));
      } else {
        console.log('Output segment is empty');
      }
    }
  });

program.addHelpText('beforeAll', figlet.textSync('Cairo VM TypeScript'));
program.addHelpText(
  'beforeAll',
  '\nGitHub: https://github.com/kkrt-labs/cairo-vm-ts\nTelegram: https://t.me/cairovmts\n'
);
program.showHelpAfterError();
program.parse();
