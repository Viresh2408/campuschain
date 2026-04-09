const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

async function setupCors() {
  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) {
    console.error('❌ AWS_S3_BUCKET not found in .env.local');
    return;
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  });

  const corsConfig = {
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
          AllowedOrigins: ['*'], // In production, replace with actual domains
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  };

  try {
    console.log(`⏳ Setting CORS policy for bucket: ${bucketName}...`);
    await s3.send(new PutBucketCorsCommand(corsConfig));
    console.log('✅ CORS policy updated successfully!');
  } catch (err) {
    console.error('❌ Error updating CORS policy:', err.message);
    if (err.name === 'NoSuchBucket') {
      console.error('   The bucket does not exist. Please create it first.');
    }
  }
}

setupCors();
