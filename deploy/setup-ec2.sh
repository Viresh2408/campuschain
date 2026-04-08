#!/bin/bash
# ============================================================
# deploy/setup-ec2.sh
#
# Run this script ON THE EC2 INSTANCE after SSH-ing in.
# It installs Docker, clones the project, creates the .env
# file, builds the Docker image, and starts the container.
#
# Usage:
#   ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
#   curl -O https://raw.githubusercontent.com/.../setup-ec2.sh
#   chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "   CampusChain EC2 Setup & Deployment"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── 1. System Updates & Docker Install ───────────────────────────────────────
echo "▶ [1/5] Installing system dependencies..."

yum update -y
yum install -y docker git curl

# Start Docker daemon
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group (so no sudo needed)
usermod -aG docker ec2-user

# Install Docker Compose v2 plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "  ✅ Docker $(docker --version) installed"
echo "  ✅ Docker Compose $(docker compose version) installed"

# ─── 2. Clone / Update Project ────────────────────────────────────────────────
echo ""
echo "▶ [2/5] Setting up project directory..."

APP_DIR="/home/ec2-user/campuschain"

if [ -d "$APP_DIR" ]; then
  echo "  📁 Project exists — pulling latest changes..."
  cd "$APP_DIR" && git pull
else
  echo "  📁 Cloning project..."
  # Clone from your GitHub repo — UPDATE THIS URL
  git clone https://github.com/Viresh2408/campuschain.git "$APP_DIR"
fi

cd "$APP_DIR"
echo "  ✅ Project ready at $APP_DIR"

# ─── 3. Create .env file on EC2 ───────────────────────────────────────────────
echo ""
echo "▶ [3/5] Creating production .env file..."
echo "  ⚠️  You'll be prompted for your secrets. These are NOT stored anywhere except .env"
echo ""

read -p "  NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "  NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -s -p "  SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_KEY; echo
read -s -p "  JWT_SECRET: " JWT_SECRET; echo
read -p "  NEXT_PUBLIC_EMAILJS_SERVICE_ID: " EMAILJS_SID
read -p "  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: " EMAILJS_TID
read -p "  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: " EMAILJS_KEY
read -p "  AWS_REGION (e.g. us-east-1): " AWS_REGION
read -s -p "  AWS_ACCESS_KEY_ID: " AWS_KEY_ID; echo
read -s -p "  AWS_SECRET_ACCESS_KEY: " AWS_SECRET; echo
read -s -p "  AWS_SESSION_TOKEN: " AWS_SESSION; echo
read -p "  AWS_S3_BUCKET: " S3_BUCKET
read -p "  AWS_SNS_FRAUD_TOPIC_ARN: " SNS_ARN
read -p "  AWS_DYNAMODB_TABLE (default: CampusChainFraudLogs): " DYNAMO_TABLE
DYNAMO_TABLE="${DYNAMO_TABLE:-CampusChainFraudLogs}"

cat > "$APP_DIR/.env" << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
JWT_SECRET=${JWT_SECRET}
NEXT_PUBLIC_EMAILJS_SERVICE_ID=${EMAILJS_SID}
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=${EMAILJS_TID}
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=${EMAILJS_KEY}
AWS_REGION=${AWS_REGION}
AWS_ACCESS_KEY_ID=${AWS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET}
AWS_SESSION_TOKEN=${AWS_SESSION}
AWS_S3_BUCKET=${S3_BUCKET}
AWS_SNS_FRAUD_TOPIC_ARN=${SNS_ARN}
AWS_DYNAMODB_TABLE=${DYNAMO_TABLE}
EOF

chmod 600 "$APP_DIR/.env"
echo "  ✅ .env file created (permissions: 600)"

# ─── 4. Enable Standalone Output in next.config.ts ────────────────────────────
echo ""
echo "▶ [4/5] Building Docker image (this takes 3-5 minutes)..."

cd "$APP_DIR"

# Build using docker-compose (reads .env automatically)
docker compose --env-file .env build --no-cache

echo "  ✅ Docker image built successfully"

# ─── 5. Start the Container ───────────────────────────────────────────────────
echo ""
echo "▶ [5/5] Starting CampusChain container..."

# Stop existing container if running
docker compose down 2>/dev/null || true

# Start in detached mode
docker compose --env-file .env up -d

# Wait a moment and verify
sleep 5
if docker ps | grep -q "campuschain-app"; then
  echo "  ✅ Container is running!"
else
  echo "  ❌ Container failed to start. Checking logs:"
  docker compose logs --tail=50
  exit 1
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "   🎉 CampusChain is LIVE!"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  🌐 Public URL: http://${PUBLIC_IP}:3000"
echo "  📋 Logs:       docker compose logs -f"
echo "  🔄 Restart:    docker compose restart"
echo "  ⛔ Stop:       docker compose down"
echo ""
