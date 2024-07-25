#! /usr/bin/env bun

import { Command, Option } from '@commander-js/extra-typings';
import { consola } from 'consola';
import { Argument } from 'commander';

import { run } from 'scripts/run';

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
      if (!path.match(/\.json$/)) throw new Error(`${path} is not a JSON`);
      return path;
    })
  )
  .option('-s, --silent', 'silent all logs')
  .addOption(
    new Option('--layout <LAYOUT>', 'Layout to be used').default('plain')
  )
  .addOption(
    new Option('--fn <NAME>', 'Function to be executed').default('main')
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
  .action((path, options) => {
    run(String(path), options, consola, VERSION_CLI);
  });

program.addHelpText(
  'beforeAll',
  '\nGitHub: https://github.com/kkrt-labs/cairo-vm-ts\nTelegram: https://t.me/cairovmts\n'
);
program.showHelpAfterError();
program.parse();
