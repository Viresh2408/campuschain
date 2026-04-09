import { getS3Client } from './aws';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

/**
 * Generates a presigned URL for uploading a file to S3.
 * @param {string} key - The S3 object key (path).
 * @param {string} contentType - The MIME type of the file.
 * @returns {Promise<string>} The presigned URL.
 */
export async function getUploadUrl(key, contentType) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 5 minutes
  return await getSignedUrl(client, command, { expiresIn: 300 });
}

/**
 * Generates a presigned URL for downloading/viewing a file from S3.
 * @param {string} key - The S3 object key (path).
 * @returns {Promise<string>} The presigned URL.
 */
export async function getDownloadUrl(key) {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // URL expires in 1 hour
  return await getSignedUrl(client, command, { expiresIn: 3600 });
}
