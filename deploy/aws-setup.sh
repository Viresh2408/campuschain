#!/bin/bash
# ============================================================
# deploy/aws-setup.sh
# Creates AWS resources required by CampusChain:
#   - S3 bucket for receipts
#   - SNS topic for fraud alerts (email subscription)
#   - DynamoDB table for fraud audit logs
#   - CloudWatch log group
#
# Run this ONCE from your LOCAL machine (with AWS CLI configured)
# before deploying to EC2.
# ============================================================

set -e
REGION="${AWS_REGION:-us-east-1}"
BUCKET_NAME="campuschain-receipts-$(date +%s)"
SNS_TOPIC_NAME="CampusChain-FraudAlerts"
DYNAMO_TABLE="CampusChainFraudLogs"
LOG_GROUP="/campuschain/app"
ALERT_EMAIL="${ALERT_EMAIL:-your-email@example.com}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "   CampusChain — AWS Resource Setup"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Region     : $REGION"
echo "S3 Bucket  : $BUCKET_NAME"
echo "SNS Topic  : $SNS_TOPIC_NAME"
echo "DynamoDB   : $DYNAMO_TABLE"
echo "Alert Email: $ALERT_EMAIL"
echo ""

# ─── 1. S3 Bucket ─────────────────────────────────────────────────────────────
echo "▶ [1/4] Creating S3 bucket..."

if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION"
else
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
fi

# Enable versioning (useful for receipt recovery)
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

# Block all public access (receipts served via pre-signed URLs or made public per-object)
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

# Add bucket CORS for browser uploads
aws s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET","PUT","POST"],
      "AllowedOrigins": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'

echo "  ✅ S3 Bucket created: $BUCKET_NAME"

# ─── 2. SNS Topic ─────────────────────────────────────────────────────────────
echo ""
echo "▶ [2/4] Creating SNS topic for fraud alerts..."

SNS_TOPIC_ARN=$(aws sns create-topic \
  --name "$SNS_TOPIC_NAME" \
  --region "$REGION" \
  --query 'TopicArn' \
  --output text)

# Subscribe the alert email
aws sns subscribe \
  --topic-arn "$SNS_TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$ALERT_EMAIL" \
  --region "$REGION"

echo "  ✅ SNS Topic ARN: $SNS_TOPIC_ARN"
echo "  📧 Subscription confirmation sent to: $ALERT_EMAIL"
echo "     ⚠️  CHECK YOUR EMAIL and click 'Confirm subscription' before testing!"

# ─── 3. DynamoDB Table ────────────────────────────────────────────────────────
echo ""
echo "▶ [3/4] Creating DynamoDB table: $DYNAMO_TABLE..."

aws dynamodb create-table \
  --table-name "$DYNAMO_TABLE" \
  --attribute-definitions \
    AttributeName=alertId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=alertId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=CampusChain Key=Environment,Value=Production

# Wait until table is active
echo "  ⏳ Waiting for DynamoDB table to become active..."
aws dynamodb wait table-exists --table-name "$DYNAMO_TABLE" --region "$REGION"

echo "  ✅ DynamoDB table created: $DYNAMO_TABLE"

# ─── 4. CloudWatch Log Group ──────────────────────────────────────────────────
echo ""
echo "▶ [4/4] Creating CloudWatch log group: $LOG_GROUP..."

aws logs create-log-group \
  --log-group-name "$LOG_GROUP" \
  --region "$REGION" 2>/dev/null || true

# Set 30-day retention
aws logs put-retention-policy \
  --log-group-name "$LOG_GROUP" \
  --retention-in-days 30 \
  --region "$REGION"

echo "  ✅ CloudWatch log group created: $LOG_GROUP (30-day retention)"

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "   Setup Complete! Add these to your .env :"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "AWS_REGION=$REGION"
echo "AWS_S3_BUCKET=$BUCKET_NAME"
echo "AWS_SNS_FRAUD_TOPIC_ARN=$SNS_TOPIC_ARN"
echo "AWS_DYNAMODB_TABLE=$DYNAMO_TABLE"
echo ""
echo "⚠️  Remember to also set:"
echo "   AWS_ACCESS_KEY_ID=<from Learner Lab>"
echo "   AWS_SECRET_ACCESS_KEY=<from Learner Lab>"
echo "   AWS_SESSION_TOKEN=<from Learner Lab>"
echo ""
