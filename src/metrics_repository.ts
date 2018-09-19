import * as moment from 'moment';
import * as path from 'path';

import {IMetricsRepository, Metric, MetricMeasurementPoint, ProcessToken} from '@process-engine/metrics_api_contracts';

import * as FileSystemAdapter from './adapter';

export class MetricsRepository implements IMetricsRepository {

  public config: any;

  public async readMetricsForProcessModel(processModelId: string): Promise<Array<Metric>> {

    const fileNameWithExtension: string = `${processModelId}.met`;

    const metricFilePath: string = this._buildPath(fileNameWithExtension);

    const metricFileExists: boolean = FileSystemAdapter.targetExists(metricFilePath);
    if (!metricFileExists) {
      return [];
    }

    const metrics: Array<Metric> = FileSystemAdapter.readAndParseFile(metricFilePath);

    return metrics;
  }

  public async writeMetricForProcessModel(correlationId: string,
                                          processModelId: string,
                                          metricType: MetricMeasurementPoint,
                                          timestamp: moment.Moment,
                                          error?: Error): Promise<void> {

    const metricValues: Array<string> =
      ['ProcessModel', timestamp.toISOString(), correlationId, processModelId, '', '', metricType, '{}'];

    if (error) {
      const stringifiedError: string = JSON.stringify(error);
      metricValues.push(stringifiedError);
    }

    await this._writeMetricToFileSystem(processModelId, ...metricValues);
  }

  public async writeMetricForFlowNode(correlationId: string,
                                      processModelId: string,
                                      flowNodeInstanceId: string,
                                      flowNodeId: string,
                                      metricType: MetricMeasurementPoint,
                                      token: ProcessToken,
                                      timestamp: moment.Moment,
                                      error?: Error): Promise<void> {

    const stringyfiedToken: string = JSON.stringify(token);

    const metricValues: Array<string> =
      ['FlowNodeInstance', timestamp.toISOString(), correlationId, processModelId, flowNodeInstanceId, flowNodeId, metricType, stringyfiedToken];

    if (error) {
      const stringifiedError: string = JSON.stringify(error);
      metricValues.push(stringifiedError);
    }

    await this._writeMetricToFileSystem(processModelId, ...metricValues);
  }

  private async _writeMetricToFileSystem(processModelId: string, ...metricValues: Array<string>): Promise<void> {

    const filePathWithExtension: string = `${processModelId}.met`;
    const targetFilePath: string = this._buildPath(filePathWithExtension);

    const metricEntryAsString: string = this._buildMetricString(...metricValues);

    await FileSystemAdapter.ensureDirectoryExists(targetFilePath);
    await FileSystemAdapter.writeToFile(targetFilePath, metricEntryAsString);
  }

  private _buildPath(...pathSegments: Array<string>): string {
    return path.resolve(process.cwd(), this.config.output_path, ...pathSegments);
  }

  private _buildMetricString(...args: Array<string>): string {
    return args.join(';');
  }

}
