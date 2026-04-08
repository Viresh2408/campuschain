/**
 * AWS SDK Client Initializer — CampusChain
 * Centralizes all AWS service clients to reuse connections
 * across S3, SNS, CloudWatch, and DynamoDB.
 */
import { S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN, // required for Learner Lab
  },
};

// ── S3 ──────────────────────────────────────────────────────────────────────
let _s3Client;
export function getS3Client() {
  if (!_s3Client) _s3Client = new S3Client(awsConfig);
  return _s3Client;
}

// ── SNS ─────────────────────────────────────────────────────────────────────
let _snsClient;
export function getSNSClient() {
  if (!_snsClient) _snsClient = new SNSClient(awsConfig);
  return _snsClient;
}

// ── CloudWatch Metrics ───────────────────────────────────────────────────────
let _cwClient;
export function getCloudWatchClient() {
  if (!_cwClient) _cwClient = new CloudWatchClient(awsConfig);
  return _cwClient;
}

// ── CloudWatch Logs ──────────────────────────────────────────────────────────
let _cwLogsClient;
export function getCloudWatchLogsClient() {
  if (!_cwLogsClient) _cwLogsClient = new CloudWatchLogsClient(awsConfig);
  return _cwLogsClient;
}

// ── DynamoDB (Document Client for easy JSON operations) ──────────────────────
let _dynamoClient;
export function getDynamoClient() {
  if (!_dynamoClient) {
    const rawClient = new DynamoDBClient(awsConfig);
    _dynamoClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return _dynamoClient;
}
