import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

import {Metric} from '@process-engine/metrics_api_contracts';

import {parseMetric} from './parser/parser';

export function targetExists(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

export async function ensureDirectoryExists(targetFilePath: string): Promise<void> {

  // eslint-disable-next-line consistent-return
  return new Promise<void>((resolve: Function, reject: Function): void => {

    const parsedPath = path.parse(targetFilePath);

    const targetDirectoryExists = fs.existsSync(parsedPath.dir);

    if (targetDirectoryExists) {
      return resolve();
    }

    mkdirp(parsedPath.dir, (error: Error, data: string): void => {

      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

export async function writeToFile(targetFilePath: string, entry: string): Promise<void> {

  return new Promise<void>((resolve: Function, reject: Function): void => {
    const fileStream = fs.createWriteStream(targetFilePath, {flags: 'a'});

    // Note: using "end" instead of "write" will result in the stream being closed immediately afterwards, thus releasing the file.
    fileStream.end(`${entry}\n`, 'utf-8', (): void => {
      return resolve();
    });
  });
}

export function readAndParseDirectory(dirPath: string): Array<Metric> {

  const fileNames = fs.readdirSync(dirPath);

  const metrics: Array<Metric> = [];

  for (const fileName of fileNames) {
    const fullFilePath = path.join(dirPath, fileName);
    const entries = readAndParseFile(fullFilePath);
    Array.prototype.push.apply(metrics, entries);
  }

  return metrics;
}

export function readAndParseFile(filePath: string): Array<Metric> {

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const entriesRaw = fileContent.split('\n');

  // Filter out empty lines and the final new line.
  const filteredEntries = entriesRaw.filter((entry: string): boolean => {
    return entry.length > 0;
  });

  const metrics = filteredEntries.map(parseMetric);

  return metrics;
}
