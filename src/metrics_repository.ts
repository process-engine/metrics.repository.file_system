import {IMetricsRepository, MetricEntry, MetricType} from '@process-engine/metrics_api_contracts';

import * as path from 'path';

import * as FileSystemAdapter from './adapter';

export class MetricsRepository implements IMetricsRepository {

  public config: any;

  public async readMetricsForProcessModel(processModelId: string): Promise<Array<MetricEntry>> {

    const fileNameWithExtension: string = `${processModelId}.met`;

    const logFilePath: string = this._buildPath(fileNameWithExtension);

    const logFileExists: boolean = FileSystemAdapter.targetExists(logFilePath);
    if (!logFileExists) {
      return [];
    }

    const correlationLogs: Array<MetricEntry> = FileSystemAdapter.readAndParseFile(logFilePath);

    return correlationLogs;
  }

  public async writeMetricForProcessModel(correlationId: string,
                                          processModelId: string,
                                          metricType: MetricType,
                                          timestamp: Date): Promise<void> {

    const logEntryAsString: string = [timestamp, correlationId, processModelId, metricType].join('\t');
    await this._writeLogEntryToFileSystem(correlationId, processModelId, logEntryAsString);
  }

  public async writeMetricForFlowNode(correlationId: string,
                                      processModelId: string,
                                      flowNodeInstanceId: string,
                                      flowNodeId: string,
                                      metricType: MetricType,
                                      timestamp: Date): Promise<void> {

    const logEntryAsString: string = [timestamp, correlationId, processModelId, flowNodeInstanceId, flowNodeId, metricType].join('\t');
    await this._writeLogEntryToFileSystem(correlationId, processModelId, logEntryAsString);
  }

  private async _writeLogEntryToFileSystem(correlationId: string, processModelId: string, entry: string): Promise<void> {

    const targetFilePath: string = this._buildPath(correlationId, processModelId);

    await FileSystemAdapter.ensureDirectoryExists(targetFilePath);
    await FileSystemAdapter.writeToLogFile(targetFilePath, entry);
  }

  private _buildPath(...pathSegments: Array<string>): string {
    return path.resolve(process.cwd(), this.config.log_output_path, ...pathSegments);
  }

}
