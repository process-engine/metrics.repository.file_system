import * as moment from 'moment';

import {Metric, MetricMeasurementPoint} from '@process-engine/metrics_api_contracts';

import * as ErrorSerializer from '../error_serializer';

export function parseProcessModelMetric(metricData: Array<string>): Metric {

  const isV2 = metricData[0].endsWith('_V2');

  if (isV2) {
    return parseAsV2(metricData);
  }

  return parseAsV1(metricData);
}

/**
 * Parses a metrics string into the v1 format employed by the ProcessEngine.
 * In this version, errors were only added to the log, if any occured.
 *
 * @param metricData The metrics to parse.
 */
function parseAsV1(metricData: Array<string>): Metric {

  const metric = new Metric();
  metric.timeStamp = moment(metricData[1]);
  metric.correlationId = metricData[2];
  metric.processModelId = metricData[3];
  metric.metricType = MetricMeasurementPoint[metricData[6]];
  metric.error = metricData.length === 9 ? ErrorSerializer.deserialize(metricData[8]) : undefined;

  return metric;
}

/**
 * Parses a metrics string into the v2 format employed by the ProcessEngine.
 * In this format, the processInstanceId was added.
 * Also, an entry for "error" is always made, even if none occured, to ensure a consistent csv format.
 *
 * @param metricData The metrics to parse.
 */
function parseAsV2(metricData: Array<string>): Metric {

  const metric = new Metric();
  metric.timeStamp = moment(metricData[1]);
  metric.correlationId = metricData[2];
  metric.processInstanceId = metricData[3];
  metric.processModelId = metricData[4];
  metric.metricType = MetricMeasurementPoint[metricData[7]];
  metric.error = ErrorSerializer.deserialize(metricData[9]);

  return metric;
}
