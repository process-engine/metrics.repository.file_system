import * as moment from 'moment';
import * as path from 'path';

import {
  IMetricsRepository, Metric, MetricMeasurementPoint,
} from '@process-engine/metrics_api_contracts';

import * as ErrorSerializer from './adapter/error_serializer';
import * as FileSystemAdapter from './adapter/file_system_adapter';

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

  public async writeMetricForProcessInstance(
    correlationId: string,
    processInstanceId: string,
    processModelId: string,
    metricType: MetricMeasurementPoint,
    timestamp: moment.Moment,
    error?: Error,
  ): Promise<void> {

    const metricValues = [
      // Required for versioning. This way, old logs will still be readable, because they only started with "ProcessModel".
      'ProcessModel_V2',
      timestamp.toISOString(),
      correlationId,
      processInstanceId,
      processModelId,
      '',
      '',
      metricType,
      '{}',
      error ? ErrorSerializer.serialize(error) : '',
    ];

    await this.writeMetricToFileSystem(processModelId, metricValues);
  }

  public async writeMetricForFlowNodeInstance(
    correlationId: string,
    processInstanceId: string,
    processModelId: string,
    flowNodeInstanceId: string,
    flowNodeId: string,
    metricType: MetricMeasurementPoint,
    tokenPayload: any,
    timestamp: moment.Moment,
    error?: Error,
  ): Promise<void> {

    const stringyfiedToken = JSON.stringify(tokenPayload);

    const metricValues = [
      // Required for versioning. This way, old logs will still be readable, because they only started with "FlowNodeInstance".
      'FlowNodeInstance_V2',
      timestamp.toISOString(),
      correlationId,
      processInstanceId,
      processModelId,
      flowNodeInstanceId,
      flowNodeId,
      metricType,
      stringyfiedToken,
      error ? ErrorSerializer.serialize(error) : '',
    ];

    await this.writeMetricToFileSystem(processModelId, metricValues);
  }

  private async writeMetricToFileSystem(processModelId: string, metricValues: Array<string>): Promise<void> {

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
