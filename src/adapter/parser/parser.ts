import {Metric} from '@process-engine/metrics_api_contracts';

import {parseFlowNodeInstanceMetric} from './flow_node_metric_parser';
import {parseProcessModelMetric} from './process_model_metric_parser';

export function parseMetric(metricRaw: string): Metric {

  const metricRawParts = metricRaw.split(';');

  const isFlowNodeInstanceMetric = metricRawParts[0].startsWith('FlowNodeInstance');

  const metric = isFlowNodeInstanceMetric
    ? parseFlowNodeInstanceMetric(metricRawParts)
    : parseProcessModelMetric(metricRawParts);

  return metric;
}
