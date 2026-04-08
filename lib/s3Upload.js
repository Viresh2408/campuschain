/**
 * Amazon S3 — Receipt & Asset Storage
 * Uploads transaction QR receipts and profile images to S3.
 */
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client } from './aws';

const BUCKET = process.env.AWS_S3_BUCKET || 'campuschain-receipts';

/**
 * Upload a base64-encoded PNG (QR receipt) to S3.
 * @param {string} userId  - The user's UUID
 * @param {string} txId    - Transaction ID (used as filename)
 * @param {string} base64  - Base64-encoded PNG data (with or without data URI prefix)
 * @returns {Promise<string>} - Public S3 URL of the uploaded file
 */
export async function uploadReceiptToS3(userId, txId, base64) {
  const s3 = getS3Client();

  // Strip the data URI header if present: "data:image/png;base64,..."
  const raw = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(raw, 'base64');

  const key = `receipts/${userId}/${txId}.png`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      Metadata: {
        userId,
        txId,
        uploadedAt: new Date().toISOString(),
      },
    })
  );

  // Return the public HTTPS URL to the object
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Generate a pre-signed URL to allow temporary access to a private S3 object.
 * @param {string} key  - S3 object key (e.g. "receipts/userId/txId.png")
 * @param {number} expiresInSeconds  - URL validity in seconds (default 15 min)
 */
export async function getPresignedUrl(key, expiresInSeconds = 900) {
  const s3 = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Upload a raw Buffer to S3 (generic helper).
 */
export async function uploadBufferToS3(buffer, key, contentType = 'application/octet-stream', metadata = {}) {
  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    })
  );
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}
