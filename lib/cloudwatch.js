/**
 * Amazon CloudWatch — Logging & Custom Metrics
 * Provides structured logging to CloudWatch Logs and
 * custom metric publishing to CloudWatch Metrics.
 */
import {
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { getCloudWatchClient, getCloudWatchLogsClient } from './aws';

const LOG_GROUP = '/campuschain/app';
const NAMESPACE = 'CampusChain';

// Cache for sequence tokens (CloudWatch Logs requires ordering)
const sequenceTokenCache = {};

/**
 * Ensure a log group and stream exist before writing.
 */
async function ensureLogStream(logStreamName) {
  const logs = getCloudWatchLogsClient();

  // Create group (idempotent)
  try {
    await logs.send(new CreateLogGroupCommand({ logGroupName: LOG_GROUP }));
  } catch (e) {
    if (e.name !== 'ResourceAlreadyExistsException') {
      console.error('[CW] Failed to create log group:', e.message);
    }
  }

  // Create stream (idempotent)
  try {
    await logs.send(
      new CreateLogStreamCommand({ logGroupName: LOG_GROUP, logStreamName })
    );
  } catch (e) {
    if (e.name !== 'ResourceAlreadyExistsException') {
      console.error('[CW] Failed to create log stream:', e.message);
    }
  }
}

/**
 * Write a structured log message to CloudWatch Logs.
 * @param {string} logStreamName - e.g. "transactions", "fraud", "api"
 * @param {object} payload       - Arbitrary object to log as JSON
 */
export async function logToCloudWatch(logStreamName, payload) {
  try {
    await ensureLogStream(logStreamName);
    const logs = getCloudWatchLogsClient();

    // Fetch latest sequence token
    let sequenceToken = sequenceTokenCache[logStreamName];
    if (!sequenceToken) {
      const desc = await logs.send(
        new DescribeLogStreamsCommand({
          logGroupName: LOG_GROUP,
          logStreamNamePrefix: logStreamName,
        })
      );
      const stream = desc.logStreams?.find((s) => s.logStreamName === logStreamName);
      sequenceToken = stream?.uploadSequenceToken;
    }

    const params = {
      logGroupName: LOG_GROUP,
      logStreamName,
      logEvents: [
        {
          timestamp: Date.now(),
          message: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
        },
      ],
      ...(sequenceToken ? { sequenceToken } : {}),
    };

    const result = await logs.send(new PutLogEventsCommand(params));
    sequenceTokenCache[logStreamName] = result.nextSequenceToken;
  } catch (err) {
    // Non-fatal: log locally but don't crash the API
    console.error('[CW Logs] Failed to write log:', err.message);
  }
}

/**
 * Publish a custom numeric metric to CloudWatch Metrics.
 * @param {string} metricName - e.g. "TokenTransfers", "FraudEvents"
 * @param {number} value      - Numeric value
 * @param {string} unit       - CloudWatch unit: "Count", "Milliseconds", "Bytes", etc.
 * @param {Array}  dimensions - Optional dimensions [{Name, Value}]
 */
export async function putMetric(metricName, value, unit = 'Count', dimensions = []) {
  try {
    const cw = getCloudWatchClient();
    await cw.send(
      new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
            Dimensions: dimensions,
          },
        ],
      })
    );
  } catch (err) {
    console.error('[CW Metrics] Failed to put metric:', err.message);
  }
}

/**
 * Convenience: log an API request event.
 */
export async function logApiEvent(endpoint, userId, status, durationMs, extra = {}) {
  await Promise.all([
    logToCloudWatch('api-requests', { endpoint, userId, status, durationMs, ...extra }),
    putMetric('ApiRequests', 1, 'Count', [{ Name: 'Endpoint', Value: endpoint }]),
    status >= 400
      ? putMetric('ApiErrors', 1, 'Count', [{ Name: 'Endpoint', Value: endpoint }])
      : Promise.resolve(),
  ]);
}

/**
 * Convenience: log a token transfer event.
 */
export async function logTransferEvent(userId, amount, txType, txId) {
  await Promise.all([
    logToCloudWatch('transactions', { userId, amount, txType, txId }),
    putMetric('TokenTransfers', 1, 'Count', [{ Name: 'Type', Value: txType }]),
    putMetric('TokenVolume', amount, 'Count'),
  ]);
}

/**
 * Convenience: log a fraud detection event.
 */
export async function logFraudEvent(userId, severity, reasons) {
  await Promise.all([
    logToCloudWatch('fraud-detection', { userId, severity, reasons }),
    putMetric('FraudEvents', 1, 'Count', [{ Name: 'Severity', Value: severity }]),
  ]);
}
