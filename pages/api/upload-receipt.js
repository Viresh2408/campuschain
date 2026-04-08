/**
 * POST /api/upload-receipt
 * Accepts a base64-encoded QR receipt image, uploads it to S3,
 * and returns the public URL for display/download.
 */
import { requireAuth } from '../../lib/auth';
import { uploadReceiptToS3 } from '../../lib/s3Upload';
import { logToCloudWatch } from '../../lib/cloudwatch';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { txId, imageBase64 } = req.body;
  const userId = req.user.id;

  if (!txId || !imageBase64) {
    return res.status(400).json({ error: 'txId and imageBase64 are required' });
  }

  try {
    // Upload to S3
    const s3Url = await uploadReceiptToS3(userId, txId, imageBase64);

    // Log to CloudWatch (non-blocking)
    logToCloudWatch('s3-uploads', {
      userId,
      txId,
      s3Url,
      action: 'receipt_uploaded',
    }).catch(() => {});

    return res.json({ success: true, url: s3Url });
  } catch (err) {
    console.error('[upload-receipt] Error:', err.message);
    return res.status(500).json({ error: 'Failed to upload receipt: ' + err.message });
  }
}

export default requireAuth(handler);
