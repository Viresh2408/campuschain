import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.units import inch

# ─── Configuration ─────────────────────────────────────────────────────────────
BRAIN_DIR = r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748'
OUTPUT_FILE = r'c:\Project\VITI\campuschain\CampusChain_AWS_Infrastructure_v2.pdf'

IMAGES = {
    "LOGO": os.path.join(BRAIN_DIR, "campuschain_brand_logo_premium_1775666271295.png"),
    "EC2": os.path.join(BRAIN_DIR, "aws_ec2_premium_icon_1775666117688.png"),
    "S3": os.path.join(BRAIN_DIR, "aws_s3_premium_icon_1775666134280.png"),
    "SNS": os.path.join(BRAIN_DIR, "aws_sns_premium_icon_1775666149679.png"),
    "CLOUDWATCH": os.path.join(BRAIN_DIR, "aws_cloudwatch_premium_icon_1775666169122.png"),
    "DYNAMODB": os.path.join(BRAIN_DIR, "aws_dynamodb_premium_icon_1775666183654.png"),
}

SERVICES = [
    {
        "title": "Amazon EC2 (Elastic Compute Cloud)",
        "icon": IMAGES["EC2"],
        "sections": [
            ("1. Why we used it", "To provide a scalable, high-performance hosting environment for the CampusChain web application and backend services."),
            ("2. Working", "Virtual compute instances that provide resizable capacity in the cloud. We use pre-configured images (AMIs) to ensure consistent deployments across developer environments."),
            ("3. Real-World Example", "Netflix uses EC2 to scale its streaming platform to handle peak traffic during major releases without service interruption.")
        ]
    },
    {
        "title": "Amazon S3 (Simple Storage Service)",
        "icon": IMAGES["S3"],
        "sections": [
            ("1. Why we used it", "For high-durability storage of immutable transaction receipts and digital artifacts generated on the blockchain."),
            ("2. Working", "Object storage built to store and retrieve any amount of data from anywhere. Data is stored across multiple Availability Zones to ensure 99.999999999% durability."),
            ("3. Real-World Example", "Dropbox leverages S3 to provide users with a secure and redundant cloud storage experience for billions of files.")
        ]
    },
    {
        "title": "Amazon SNS (Simple Notification Service)",
        "icon": IMAGES["SNS"],
        "sections": [
            ("1. Why we used it", "To implement an instant alerting system that notifies administrators via email/SMS whenever the Fraud Engine detects high-risk transactions."),
            ("2. Working", "A fully managed Pub/Sub messaging service. Topic-based distribution allows one alert to reach multiple administrative endpoints simultaneously."),
            ("3. Real-World Example", "Uber uses SNS to send real-time push notifications, ride receipts, and authentication codes to millions of users globally.")
        ]
    },
    {
        "title": "Amazon CloudWatch",
        "icon": IMAGES["CLOUDWATCH"],
        "sections": [
            ("1. Why we used it", "To monitor system health, application logs, and custom metrics like total token volume and API error rates in real-time."),
            ("2. Working", "Collects monitoring and operational data in the form of logs and metrics, providing actionable insights into performance bottlenecks."),
            ("3. Real-World Example", "Airbnb uses CloudWatch Alarms to automatically trigger recovery actions and scaling when latency thresholds are exceeded.")
        ]
    },
    {
        "title": "Amazon DynamoDB",
        "icon": IMAGES["DYNAMODB"],
        "sections": [
            ("1. Why we used it", "To maintain a permanent, high-speed audit log of all security events and fraud detections with single-digit millisecond latency."),
            ("2. Working", "A serverless NoSQL database that automatically scales to handle throughput requirements without any manual server management."),
            ("3. Real-World Example", "Amazon.com uses DynamoDB to handle the massive high-velocity data surges during Prime Day sales events.")
        ]
    }
]

def create_pdf():
    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#2C3E50"),
        spaceAfter=30,
        alignment=1
    )
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor("#2980B9"),
        spaceBefore=20,
        spaceAfter=10
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#34495E")
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        spaceAfter=10
    )

    story = []

    # Logo and Header
    if os.path.exists(IMAGES["LOGO"]):
        logo = Image(IMAGES["LOGO"], 2*inch, 0.8*inch)
        logo.hAlign = 'LEFT'
        story.append(logo)
    
    story.append(Paragraph("AWS Infrastructure Documentation", header_style))
    story.append(Paragraph("CampusChain: Scaling the Future of Higher Education", styles['Italic']))
    story.append(Spacer(1, 0.5*inch))

    # Introduction
    intro_txt = "This official documentation details the Amazon Web Services architecture powering the CampusChain ecosystem. Each service has been selected for its industry-leading scalability, security, and integration capabilities."
    story.append(Paragraph(intro_txt, body_style))
    story.append(Spacer(1, 0.3*inch))

    # Iterate Services
    for svc in SERVICES:
        # Title with Icon
        if os.path.exists(svc["icon"]):
            img = Image(svc["icon"], 0.6*inch, 0.6*inch)
            data = [[img, Paragraph(svc["title"], title_style)]]
            t = Table(data, colWidths=[0.8*inch, 5.5*inch])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
        else:
            story.append(Paragraph(svc["title"], title_style))
        
        for label, content in svc["sections"]:
            story.append(Paragraph(label, label_style))
            story.append(Paragraph(content, body_style))
        
        story.append(Spacer(1, 0.2*inch))

    # Build PDF
    doc.build(story)
    print(f"Successfully generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    create_pdf()
