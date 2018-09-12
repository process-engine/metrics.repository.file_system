import {MetricEntry, MetricType} from '@process-engine/metrics_api_contracts';

import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

export function targetExists(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

/**
 * Checks if the given path exists and creates it, if it doesn't.
 *
 * @async
 * @param targetFilePath The directory to verify.
 */
export async function ensureDirectoryExists(targetFilePath: string): Promise<void> {

  return new Promise<void>((resolve: Function, reject: Function): void => {

    const parsedPath: path.ParsedPath = path.parse(targetFilePath);

    const targetDirectoryExists: boolean = fs.existsSync(parsedPath.dir);

    if (targetDirectoryExists) {
      return resolve();
    }

    mkdirp(parsedPath.dir, (error: Error, data: string) => {

      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

/**
 * Writes the given entry to the specificed log file.
 *
 * @async
 * @param targetFilePath The path to the file to write to.
 * @param entry          The entry to write into the file.
 */
export async function writeToLogFile(targetFilePath: string, entry: string): Promise<void> {

  const filePathWithExtension: string = `${targetFilePath}.met`;

  return new Promise<void>((resolve: Function, reject: Function): void => {
    const fileStream: fs.WriteStream = fs.createWriteStream(filePathWithExtension, {flags: 'a'});

     // Note: using "end" instead of "write" will result in the stream being closed immediately afterwards, thus releasing the file.
    fileStream.end(`${entry}\n`, (error: Error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

/**
 * Reads all files from the given directory and parses their content into
 * readable LogEntries.
 *
 * @param dirPath The path to the directory to read.
 * @returns       The parsed logs.
 */
export function readAndParseDirectory(dirPath: string): Array<MetricEntry> {

  const logfileNames: Array<string> = fs.readdirSync(dirPath);

  const correlationLogs: Array<MetricEntry> = [];

  for (const fileName of logfileNames) {
    const fullFilePath: string = path.join(dirPath, fileName);
    const logFileEntries: Array<MetricEntry> = readAndParseFile(fullFilePath);
    Array.prototype.push.apply(correlationLogs, logFileEntries);
  }

  return correlationLogs;
}

/**
 * Reads a file from the given path and parses its content into a readable
 * LogEntry.
 *
 * @param   filePath The path to the file to read.
 * @returns          The parsed log.
 */
export function readAndParseFile(filePath: string): Array<MetricEntry> {

  const logFileContent: string = fs.readFileSync(filePath, 'utf-8');

  const logEntriesRaw: Array<string> = logFileContent.split('\n');

  // Filter out empty lines and the final new line.
  const logEntriesFiltered: Array<string> = logEntriesRaw.filter((entry: string) => {
    return entry.length > 0;
  });

  const logEntries: Array<MetricEntry> = logEntriesFiltered.map(_createLogEntryFromRawData);

  return logEntries;
}

/**
 * Takes a string representing a log entry and parses its content into a usable
 * LogEntry object.
 *
 * @param   logEntryRaw The string containing the unparsed log entry.
 * @returns             The parsed LogEntry.
 */
// tslint:disable:no-magic-numbers
function _createLogEntryFromRawData(logEntryRaw: string): MetricEntry {

  const logEntryRawParts: Array<string> = logEntryRaw.split('\t');

  const isFlowNodeInstanceLog: boolean = logEntryRawParts.length === 7;

  const logEntry: MetricEntry = isFlowNodeInstanceLog
    ? _parseFlowNodeInstanceLog(logEntryRawParts)
    : _parseProcessModelLog(logEntryRawParts);

  return logEntry;
}

/**
 * Creates a LogEntry for a FlowNodeInstance from the given data.
 *
 * @param   rawData The data to parse into a LogEntry.
 * @returns         The parsed LogEntry.
 */
function _parseFlowNodeInstanceLog(rawData: Array<string>): MetricEntry {

  const logEntry: MetricEntry = new MetricEntry();
  logEntry.timeStamp = new Date(rawData[0]);
  logEntry.correlationId = rawData[1];
  logEntry.processModelId = rawData[2];
  logEntry.flowNodeInstanceId = rawData[3];
  logEntry.flowNodeId = rawData[4];
  logEntry.metricType = MetricType[rawData[6]];

  return logEntry;
}

/**
 * Creates a LogEntry for a ProcessModel from the given data.
 *
 * @param   rawData The data to parse into a LogEntry.
 * @returns         The parsed LogEntry.
 */
function _parseProcessModelLog(rawData: Array<string>): MetricEntry {

  const logEntry: MetricEntry = new MetricEntry();
  logEntry.timeStamp = new Date(rawData[0]);
  logEntry.correlationId = rawData[1];
  logEntry.processModelId = rawData[2];
  logEntry.metricType = MetricType[rawData[4]];

  return logEntry;
}
