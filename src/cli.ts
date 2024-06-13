#! /usr/bin/env bun

import { Command, Option } from '@commander-js/extra-typings';

import { LogLevels, consola } from 'consola';
import { Argument } from 'commander';
import { compareMemory } from 'scripts/compareMemory';
import { run } from 'scripts/runCli';
import { version } from 'bun';

consola.options = {
  ...consola.options,
  formatOptions: {
    date: false,
  },
};

const VERSION_CLI = '0.1.0';

const program = new Command().name('cairo').version(VERSION_CLI);

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
  .option('-s, --silent', 'silent all logs')
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
  .action((path, options) => {
    run(String(path), options, consola, version);
  });

program
  .command('compare-memory')
  .description('Compare the memory from encoded binary files')
  .addArgument(
    new Argument(
      '<FILES...>',
      'List of memory binary files to compare'
    ).argParser((path, previous) => {
      if (!path.match(/\.memory$/))
        throw new Error('Provided file is not a memory binary file');
      return previous ? [previous, path].flat() : path;
    })
  )
  .option('-s, --silent', 'silent all logs')

  .action(async (paths, options) => {
    const { silent } = options;
    if (silent) consola.level = LogLevels.silent;

    if (await compareMemory(paths as string[])) {
      consola.fail('Encoded memories are different');
    }
    consola.success('Encoded memories are similar');
  });

program.addHelpText(
  'beforeAll',
  '\nGitHub: https://github.com/kkrt-labs/cairo-vm-ts\nTelegram: https://t.me/cairovmts\n'
);
program.showHelpAfterError();
program.parse();
