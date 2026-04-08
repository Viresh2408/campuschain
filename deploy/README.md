# CampusChain — AWS Deployment Guide

Complete step-by-step guide to deploy CampusChain on AWS EC2 using Docker.

---

## Architecture

```
Internet → EC2 (port 3000) → Docker Container (Next.js)
                                    ↓
                    ┌───────────────┼───────────────┐
                   S3           DynamoDB           SNS
                (receipts)    (fraud logs)     (email alerts)
                    └───────────────┼───────────────┘
                                CloudWatch
                             (logs + metrics)
                                    ↓
                              Supabase (DB)
```

---

## Prerequisites

- AWS Academy Learner Lab **ACTIVE** (green status)
- AWS CLI installed locally
- Git installed locally
- GitHub repository with the CampusChain code (push your local code first)

---

## Step 1 — Push Code to GitHub

On your **local machine** (Windows PowerShell):

```powershell
cd c:\Project\VITI\campuschain

# Initialize git if not done
git init
git add .
git commit -m "feat: add AWS services integration + Docker"

# Push to GitHub (create repo first at github.com)
git remote add origin https://github.com/YOUR_USERNAME/campuschain.git
git push -u origin main
```

---

## Step 2 — Configure AWS CLI (Local)

Get credentials from Learner Lab:
1. Open **AWS Academy Learner Lab [149056]**
2. Click **"Start Lab"** → wait for green dot
3. Click **"AWS Details"** → **"Show"**
4. Copy `aws_access_key_id`, `aws_secret_access_key`, `aws_session_token`

Run in PowerShell:
```powershell
aws configure set aws_access_key_id YOUR_ACCESS_KEY_ID
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set aws_session_token YOUR_SESSION_TOKEN
aws configure set default.region us-east-1

# Verify
aws sts get-caller-identity
```

---

## Step 3 — Create AWS Resources

Run the setup script (**in Git Bash or WSL**, not PowerShell):
```bash
cd /c/Project/VITI/campuschain
export ALERT_EMAIL="your-email@example.com"   # ← change this!
bash deploy/aws-setup.sh
```

**⚠️ IMPORTANT:** Check your email and **confirm the SNS subscription** — click the link in the email from AWS.

Copy the output values (S3 bucket name, SNS ARN, DynamoDB table) — you'll need them in Step 5.

---

## Step 4 — Launch an EC2 Instance

In the **AWS Console** (from Learner Lab):

1. Go to **EC2** → **"Launch Instance"**
2. Settings:
   - **Name**: `campuschain-server`
   - **AMI**: `Amazon Linux 2023` (free tier)
   - **Instance type**: `t2.micro` (free tier) or `t3.small` for better performance
   - **Key pair**: Select your existing key pair (or create new)
   - **Security Group** — Add these inbound rules:

   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | My IP (only you can SSH) |
   | Custom TCP | 3000 | 0.0.0.0/0 (public access) |

3. Click **"Launch Instance"**
4. Wait ~2 minutes until Instance State = **Running**
5. Note the **Public IPv4 address** (e.g., `3.95.183.42`)

---

## Step 5 — Deploy on EC2

### SSH into the instance:
```bash
# Windows PowerShell / Command Prompt
ssh -i "C:\path\to\your-key.pem" ec2-user@<EC2-PUBLIC-IP>

# If permission error on .pem file:
icacls "C:\path\to\your-key.pem" /inheritance:r /grant:r "%USERNAME%:R"
```

### Run the setup script:
```bash
# On the EC2 instance:
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/campuschain/main/deploy/setup-ec2.sh -o setup-ec2.sh
chmod +x setup-ec2.sh
sudo bash setup-ec2.sh
```

When prompted, enter your credentials:
- **Supabase URL**: `https://jcurfdnukfmnviwcjezh.supabase.co`
- **Supabase anon key**: (from your `.env.local`)
- **Supabase service role key**: (from your `.env.local`)
- **JWT Secret**: `campuschain_super_secret_jwt_key_2024_blockchain`
- **EmailJS IDs**: (from your `.env.local`)
- **AWS credentials**: (from Learner Lab "AWS Details")
- **AWS_S3_BUCKET**: (from Step 3 output)
- **AWS_SNS_FRAUD_TOPIC_ARN**: (from Step 3 output)
- **AWS_DYNAMODB_TABLE**: `CampusChainFraudLogs`

---

## Step 6 — Access the App

Once setup completes, your app is live at:
```
http://<EC2-PUBLIC-IP>:3000
```

Example: `http://3.95.183.42:3000`

---

## Updating Credentials (Each Learner Lab Session)

AWS Academy credentials **expire every 4 hours**. To update them:

```bash
ssh -i "your-key.pem" ec2-user@<EC2-PUBLIC-IP>

# Edit the .env file with new credentials
nano /home/ec2-user/campuschain/.env

# Update these 3 lines with new values from Learner Lab:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_SESSION_TOKEN=...

# Restart the container to pick up new credentials
cd /home/ec2-user/campuschain
docker compose restart
```

---

## Monitoring

```bash
# View live logs
docker compose logs -f

# Check container status
docker ps

# View CloudWatch logs (AWS Console)
# → CloudWatch → Log Groups → /campuschain/app
# → Log streams: api-requests, transactions, fraud-detection

# View DynamoDB fraud logs (AWS Console)
# → DynamoDB → Tables → CampusChainFraudLogs → Explore items

# View S3 receipts (AWS Console)
# → S3 → campuschain-receipts-XXXXX → receipts/
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `permission denied` on .pem | Run `icacls key.pem /inheritance:r /grant:r "%USERNAME%:R"` |
| App not accessible | Check EC2 Security Group has port 3000 open to `0.0.0.0/0` |
| AWS services not working | Check credentials haven't expired (Learner Lab rotates every session) |
| Container won't start | Run `docker compose logs` on EC2 to see errors |
| SNS alert not received | Confirm the subscription email from AWS (check spam folder) |
| Build fails | Ensure GitHub repo is public OR use SSH clone |

---

## Stopping Everything

```bash
# Stop the container (preserves the image)
docker compose down

# Stop EC2 instance (via AWS Console to avoid charges)
# EC2 → Instances → Select → Stop Instance
```
