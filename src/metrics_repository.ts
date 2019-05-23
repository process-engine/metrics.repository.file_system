import * as moment from 'moment';
import * as path from 'path';

import {
  IMetricsRepository, Metric, MetricMeasurementPoint, ProcessToken,
} from '@process-engine/metrics_api_contracts';

import * as FileSystemAdapter from './adapter';

export class MetricsRepository implements IMetricsRepository {

  public config: any;

  public async readMetricsForProcessModel(processModelId: string): Promise<Array<Metric>> {

    const fileNameWithExtension = `${processModelId}.met`;

    const metricFilePath = this.buildPath(fileNameWithExtension);

    const metricFileExists = FileSystemAdapter.targetExists(metricFilePath);
    if (!metricFileExists) {
      return [];
    }

    const metrics = FileSystemAdapter.readAndParseFile(metricFilePath);

    return metrics;
  }

  public async writeMetricForProcessModel(
    correlationId: string,
    processModelId: string,
    metricType: MetricMeasurementPoint,
    timestamp: moment.Moment,
    error?: Error,
  ): Promise<void> {

    const metricValues = ['ProcessModel', timestamp.toISOString(), correlationId, processModelId, '', '', metricType, '{}'];

    if (error) {
      const stringifiedError = JSON.stringify(error);
      metricValues.push(stringifiedError);
    }

    await this.writeMetricToFileSystem(processModelId, ...metricValues);
  }

  public async writeMetricForFlowNode(
    correlationId: string,
    processModelId: string,
    flowNodeInstanceId: string,
    flowNodeId: string,
    metricType: MetricMeasurementPoint,
    token: ProcessToken,
    timestamp: moment.Moment,
    error?: Error,
  ): Promise<void> {

    const stringyfiedToken = JSON.stringify(token);

    const metricValues =
      ['FlowNodeInstance', timestamp.toISOString(), correlationId, processModelId, flowNodeInstanceId, flowNodeId, metricType, stringyfiedToken];

    if (error) {
      const stringifiedError = JSON.stringify(error);
      metricValues.push(stringifiedError);
    }

    await this.writeMetricToFileSystem(processModelId, ...metricValues);
  }

  private async writeMetricToFileSystem(processModelId: string, ...metricValues: Array<string>): Promise<void> {

    const filePathWithExtension = `${processModelId}.met`;
    const targetFilePath = this.buildPath(filePathWithExtension);

    const metricEntryAsString = this.buildMetricString(...metricValues);

    await FileSystemAdapter.ensureDirectoryExists(targetFilePath);
    await FileSystemAdapter.writeToFile(targetFilePath, metricEntryAsString);
  }

  private buildPath(...pathSegments: Array<string>): string {
    return path.resolve(process.cwd(), this.config.output_path, ...pathSegments);
  }

  private buildMetricString(...args: Array<string>): string {
    return args.join(';');
  }

}
