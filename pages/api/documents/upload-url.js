import { requireAuth } from '../../../lib/auth';
import { getUploadUrl } from '../../../lib/s3';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(445).json({ error: 'Method not allowed' });

  const { fileName, fileType, mimeType } = req.body;
  const userId = req.user.id;

  if (!fileName || !fileType || !mimeType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Define S3 Key: students/{userId}/{fileType}/{timestamp}_{fileName}
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `students/${userId}/${fileType}/${timestamp}_${safeFileName}`;

  try {
    const uploadUrl = await getUploadUrl(key, mimeType);
    res.json({ uploadUrl, key });
  } catch (error) {
    console.error('S3 Presigned URL Error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}

export default requireAuth(handler);
