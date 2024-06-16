#! /usr/bin/env bun

import { Command, Argument } from '@commander-js/extra-typings';
import { consola } from 'consola';
import { compareMemory, compareTrace } from './compare';

export const compare = async () => {
  const program = new Command()
    .name('compare')
    .description('Compare encoded memory and/or trace');

  program
    .command('memory')
    .description('Compare the encoded memory files')
    .option('-s, --silent', 'silent all logs')
    .addArgument(
      new Argument(
        '<FILES...>',
        'Cairo programs to compare memory on'
      ).argParser((path, files) => {
        if (!path.match(/\.memory$/))
          throw new Error('Provided file is not a memory file');
        const file = path as string;
        return files ? [files, file].flat() : [file];
      })
    )
    .action(async (paths, { silent }) => {
      await compareMemory(paths as string[], !!silent, consola);
    });

  program
    .command('trace')
    .description('Compare the encoded trace files')
    .addArgument(
      new Argument(
        '<FILES...>',
        'Cairo programs to compare trace on'
      ).argParser((path, files) => {
        if (!path.match(/\.trace$/))
          throw new Error('Provided file is not a trace file');
        const file = path as string;
        return files ? [files, file].flat() : [file];
      })
    )
    .option('-s, --silent', 'silent all logs')
    .action(async (paths, { silent }) => {
      await compareTrace(paths as string[], !!silent, consola);
    });

  await program.parseAsync();
};

compare();
