/**
 * Amazon DynamoDB — Fraud Audit Log Store
 * Persists fraud detection events in DynamoDB for fast,
 * durable audit trail independent of Supabase.
 */
import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient } from './aws';
import { randomUUID } from 'crypto';

const TABLE = process.env.AWS_DYNAMODB_TABLE || 'CampusChainFraudLogs';

/**
 * Write a fraud alert record to DynamoDB.
 * @param {object} params
 * @param {string} params.userId    - User UUID
 * @param {string} params.userName  - Display name
 * @param {number} params.amount    - Transaction amount (CC)
 * @param {string} params.txType    - Transaction type
 * @param {string} params.severity  - 'high' | 'medium' | 'low'
 * @param {string[]} params.reasons - Rule violation strings
 * @returns {Promise<string>} alertId - Newly created alert UUID
 */
export async function writeFraudLog({ userId, userName, amount, txType, severity, reasons }) {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.warn('[DynamoDB] AWS credentials not set — skipping fraud log');
    return null;
  }

  const dynamo = getDynamoClient();
  const alertId = randomUUID();
  const timestamp = new Date().toISOString();

  const item = {
    alertId,                // Partition Key (PK)
    timestamp,              // Sort Key (SK) — enables range queries
    userId,
    userName: userName || 'Unknown',
    amount: String(amount), // DynamoDB: store numbers as strings to avoid precision issues
    txType,
    severity,
    reasons,                // Array of strings
    resolvedAt: null,       // For admin to mark as reviewed
    notes: '',
  };

  try {
    await dynamo.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
      })
    );
    console.log('[DynamoDB] Fraud log written. alertId:', alertId);
    return alertId;
  } catch (err) {
    console.error('[DynamoDB] Failed to write fraud log:', err.message);
    return null;
  }
}

/**
 * Retrieve all fraud logs (admin panel).
 * Uses Scan since we need all records.
 * For production with high volume, add a GSI on userId or timestamp.
 * @param {number} limit - Max records to return (default 100)
 */
export async function getFraudLogs(limit = 100) {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return [];
  }

  const dynamo = getDynamoClient();
  try {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLE,
        Limit: limit,
      })
    );
    // Sort by timestamp descending
    return (result.Items || []).sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (err) {
    console.error('[DynamoDB] Failed to fetch fraud logs:', err.message);
    return [];
  }
}

/**
 * Get fraud logs for a specific user.
 */
export async function getFraudLogsByUser(userId) {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return [];
  }

  const dynamo = getDynamoClient();
  try {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      })
    );
    return (result.Items || []).sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (err) {
    console.error('[DynamoDB] Failed to fetch user fraud logs:', err.message);
    return [];
  }
}
