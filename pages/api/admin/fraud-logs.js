/**
 * GET /api/admin/fraud-logs
 * Returns fraud audit logs from DynamoDB (admin only).
 * Includes all fraud events with full details for review.
 */
import { requireAuth } from '../../../lib/auth';
import { getFraudLogs, getFraudLogsByUser } from '../../../lib/dynamoFraud';
import { logToCloudWatch } from '../../../lib/cloudwatch';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only admins can access this endpoint
  const user = req.user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { userId, limit = '100' } = req.query;

  try {
    let logs;
    if (userId) {
      logs = await getFraudLogsByUser(userId);
    } else {
      logs = await getFraudLogs(parseInt(limit, 10));
    }

    // Log this admin query to CloudWatch
    logToCloudWatch('admin-actions', {
      action: 'view_fraud_logs',
      adminId: user.id,
      filterUserId: userId || 'all',
      resultCount: logs.length,
    }).catch(() => {});

    return res.json({
      success: true,
      count: logs.length,
      source: 'dynamodb',
      logs,
    });
  } catch (err) {
    console.error('[fraud-logs] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch fraud logs: ' + err.message });
  }
}

export default requireAuth(handler);
