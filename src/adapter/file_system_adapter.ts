import {Metric, MetricMeasurementPoint} from '@process-engine/metrics_api_contracts';

import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as moment from 'moment';
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
 * Writes the given entry to the specificed file.
 *
 * @async
 * @param targetFilePath The path to the file to write to.
 * @param entry          The entry to write into the file.
 */
export async function writeToFile(targetFilePath: string, entry: string): Promise<void> {

  return new Promise<void>((resolve: Function, reject: Function): void => {
    const fileStream: fs.WriteStream = fs.createWriteStream(targetFilePath, {flags: 'a'});

     // Note: using "end" instead of "write" will result in the stream being closed immediately afterwards, thus releasing the file.
    fileStream.end(`${entry}\n`, 'utf-8', () => {
      return resolve();
    });
  });
}

/**
 * Reads all files from the given directory and parses their content into
 * readable metrics.
 *
 * @param dirPath The path to the directory to read.
 * @returns       The parsed metrics.
 */
export function readAndParseDirectory(dirPath: string): Array<Metric> {

  const fileNames: Array<string> = fs.readdirSync(dirPath);

  const metrics: Array<Metric> = [];

  for (const fileName of fileNames) {
    const fullFilePath: string = path.join(dirPath, fileName);
    const entries: Array<Metric> = readAndParseFile(fullFilePath);
    Array.prototype.push.apply(metrics, entries);
  }

  return metrics;
}

/**
 * Reads a file from the given path and parses its content into a readable
 * metrics.
 *
 * @param   filePath The path to the file to read.
 * @returns          The parsed metrics.
 */
export function readAndParseFile(filePath: string): Array<Metric> {

  const fileContent: string = fs.readFileSync(filePath, 'utf-8');

  const entriesRaw: Array<string> = fileContent.split('\n');

  // Filter out empty lines and the final new line.
  const filteredEntries: Array<string> = entriesRaw.filter((entry: string) => {
    return entry.length > 0;
  });

  const metrics: Array<Metric> = filteredEntries.map(_createMetricFromRawData);

  return metrics;
}

/**
 * Takes a string representing a metric and parses its content into a usable
 * Metric-object.
 *
 * @param   metricRaw The string containing the unparsed metric.
 * @returns           The parsed Metric.
 */
// tslint:disable:no-magic-numbers
function _createMetricFromRawData(metricRaw: string): Metric {

  const metricRawParts: Array<string> = metricRaw.split(';');

  const isFlowNodeInstanceMetric: boolean = metricRawParts[0] === 'FlowNodeInstance';

  const metric: Metric = isFlowNodeInstanceMetric
    ? _parseFlowNodeInstanceMetric(metricRawParts)
    : _parseProcessModelMetric(metricRawParts);

  return metric;
}

/**
 * Creates a Metric for a FlowNodeInstance from the given data.
 *
 * @param   rawData The data to parse into a Metric.
 * @returns         The parsed Metric.
 */
function _parseFlowNodeInstanceMetric(rawData: Array<string>): Metric {

  const metric: Metric = new Metric();
  metric.timeStamp = moment(rawData[1]);
  metric.correlationId = rawData[2];
  metric.processModelId = rawData[3];
  metric.flowNodeInstanceId = rawData[4];
  metric.flowNodeId = rawData[5];
  metric.metricType = MetricMeasurementPoint[rawData[6]];
  metric.processToken = JSON.parse(rawData[7]);

  return metric;
}

/**
 * Creates a Metric for a ProcessModel from the given data.
 *
 * @param   rawData The data to parse into a Metric.
 * @returns         The parsed Metric.
 */
function _parseProcessModelMetric(rawData: Array<string>): Metric {

  const metric: Metric = new Metric();
  metric.timeStamp = moment(rawData[1]);
  metric.correlationId = rawData[2];
  metric.processModelId = rawData[3];
  metric.metricType = MetricMeasurementPoint[rawData[7]];

  return metric;
}
