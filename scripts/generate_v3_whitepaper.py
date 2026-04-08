import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.units import inch

# ─── Configuration ─────────────────────────────────────────────────────────────
BRAIN_DIR = r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748'
OUTPUT_FILE = r'c:\Project\VITI\campuschain\CampusChain_Strategic_Infrastructure_v3.pdf'

IMAGES = {
    "LOGO": os.path.join(BRAIN_DIR, "campuschain_brand_logo_premium_1775666271295.png"),
    "EC2": os.path.join(BRAIN_DIR, "aws_ec2_premium_icon_1775666117688.png"),
    "S3": os.path.join(BRAIN_DIR, "aws_s3_premium_icon_1775666134280.png"),
    "SNS": os.path.join(BRAIN_DIR, "aws_sns_premium_icon_1775666149679.png"),
    "CLOUDWATCH": os.path.join(BRAIN_DIR, "aws_cloudwatch_premium_icon_1775666169122.png"),
    "DYNAMODB": os.path.join(BRAIN_DIR, "aws_dynamodb_premium_icon_1775666183654.png"),
    "SECURITY": os.path.join(BRAIN_DIR, "aws_security_premium_icon_1775666778868.png"),
    "ARCHITECTURE": os.path.join(BRAIN_DIR, "aws_architecture_flow_icon_1775666796214.png"),
}

# ─── Content ───────────────────────────────────────────────────────────────────
PILLARS = [
    {
        "title": "Pillar 1: The Resilient Computing Foundation",
        "service": "Amazon EC2 (Elastic Compute Cloud)",
        "icon": IMAGES["EC2"],
        "body": (
            "<b>Strategic Role:</b> The engine of the CampusChain experience. EC2 provides the consistent, localized high-performance compute "
            "required to maintain the node stability of our student credential ledger.<br/><br/>"
            "<b>Institutional Meaning:</b> By leveraging AWS instances across multiple Availability Zones, CampusChain ensures that student portals "
            "and administrative dashboards are accessible 24/7, mirroring the non-stop nature of modern campus life. This resilience is what allows "
            "universities to scale from hundreds to tens of thousands of simultaneous credential requests without performance degradation."
        ),
        "real_world": "Netflix uses EC2 to provide sub-second latency for millions of concurrent users, a gold standard we apply to student data access."
    },
    {
        "title": "Pillar 2: The Vault of Immutable Truth",
        "service": "Amazon S3 (Simple Storage Service)",
        "icon": IMAGES["S3"],
        "body": (
            "<b>Strategic Role:</b> The final resting place for digital trust. S3 acts as the permanent archive for every blockchain-validated "
            "receipt and diploma issued on the platform.<br/><br/>"
            "<b>Institutional Meaning:</b> In higher education, a degree is a life-long asset. S3's 99.999999999% durability ensures that "
            "a credential issued today will be verifiable decades from now. This 'Immutable Vault' provides the physical storage foundation for "
            "the mathematical security of the blockchain, preventing data loss or tampering in the long term."
        ),
        "real_world": "Dropbox and Nasdaq rely on S3 to store mission-critical data where even a single byte of loss is unacceptable."
    },
    {
        "title": "Pillar 3: The Reactive Sentinel Shield",
        "service": "Amazon SNS (Simple Notification Service)",
        "icon": IMAGES["SNS"],
        "body": (
            "<b>Strategic Role:</b> The nervous system of our security infrastructure. SNS bridges the gap between the blockchain's internal "
            "state and institutional stakeholders.<br/><br/>"
            "<b>Institutional Meaning:</b> Security in 2024 requires immediate visibility. When the CampusChain Fraud Engine identifies a "
            "suspicious transaction attempt, SNS triggers a multi-channel alert protocol (Email, SMS, Webhooks). This eliminates delay, "
            "allowing university security teams to respond to potential credential theft in real-time before serious reputational damage can occur."
        ),
        "real_world": "Uber uses SNS to manage real-time communication between millions of drivers and riders, ensuring safety and precision at scale."
    },
    {
        "title": "Pillar 4: Operational Intelligence & Auditability",
        "service": "Amazon CloudWatch & DynamoDB",
        "icon": IMAGES["CLOUDWATCH"],
        "body": (
            "<b>Strategic Role:</b> Continuous observability and high-velocity record-keeping. Together, these services provide a 360-degree "
            "view of platform health.<br/><br/>"
            "<b>Institutional Meaning:</b> Trust is built on transparency. CloudWatch allows us to provide real-time dashboards of transaction "
            "throughput, while DynamoDB stores a queryable audit trail of every security event. This visibility ensures that institutional auditors "
            "can verify the platform's integrity at any moment, shifting from 'static reports' to 'live organizational intelligence'."
        ),
        "real_world": "Capital One and Amazon.com use these services to process billions of transactions with single-digit millisecond response times."
    }
]

def create_v3_pdf():
    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    main_title_style = ParagraphStyle('MainTitle', fontSize=28, textColor=colors.HexColor("#1A237E"), spaceAfter=40, fontName='Helvetica-Bold', alignment=1)
    subtitle_style = ParagraphStyle('Subtitle', fontSize=14, textColor=colors.HexColor("#3F51B5"), spaceAfter=10, fontName='Helvetica-Oblique', alignment=1)
    executive_title = ParagraphStyle('ExecTitle', parent=styles['Heading2'], fontSize=20, textColor=colors.HexColor("#2C3E50"), spaceBefore=30, spaceAfter=15)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=11, leading=16, spaceAfter=12)
    pillar_title_style = ParagraphStyle('PillarTitle', fontSize=18, textColor=colors.HexColor("#0D47A1"), spaceBefore=20, spaceAfter=10, fontName='Helvetica-Bold')
    service_label = ParagraphStyle('ServiceLabel', fontSize=10, textColor=colors.HexColor("#546E7A"), fontName='Helvetica-BoldOblique')
    real_world_style = ParagraphStyle('RealWorld', fontSize=9, textColor=colors.HexColor("#455A64"), leftIndent=20, spaceBefore=5, fontName='Helvetica-Oblique')

    story = []

    # ─── PAGE 1: COVER PAGE ───
    story.append(Spacer(1, 1.5*inch))
    if os.path.exists(IMAGES["LOGO"]):
        logo = Image(IMAGES["LOGO"], 3*inch, 1.2*inch)
        logo.hAlign = 'CENTER'
        story.append(logo)
    
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Strategic Infrastructure Whitepaper", subtitle_style))
    story.append(Paragraph("CampusChain: The Future of Academic Trust", main_title_style))
    story.append(Spacer(1, 1*inch))
    
    story.append(Paragraph("Presented by CampusChain Engineering Division", subtitle_style))
    story.append(Paragraph("Version 3.0 | April 2024", styles['Normal']))
    story.append(PageBreak())

    # ─── PAGE 2: EXECUTIVE SUMMARY & ARCHITECTURE ───
    story.append(Paragraph("Executive Summary", executive_title))
    summary_txt = (
        "CampusChain represents a paradigm shift in how academic credentials are managed. To achieve the balance of "
        "decentralized trust and enterprise-grade performance, we have architected a cloud-native ecosystem on "
        "Amazon Web Services (AWS). This document explores the four strategic pillars of our infrastructure: "
        "Performance, Integrity, Responsiveness, and Visibility."
    )
    story.append(Paragraph(summary_txt, body_style))
    
    # Architecture Section
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Architectural Synergy: The Life of a Credential", executive_title))
    if os.path.exists(IMAGES["ARCHITECTURE"]):
        arch_img = Image(IMAGES["ARCHITECTURE"], 1.5*inch, 1.5*inch)
        arch_img.hAlign = 'RIGHT'
        
        arch_txt = (
            "When a university issues a digital badge, a complex chain of events is triggered. "
            "The <b>EC2</b> interface handles the initial request with ultra-low latency; the <b>S3</b> vault "
            "immediately secures the artifact for permanent storage; the <b>Fraud Engine</b> monitors the "
            "patterns via <b>CloudWatch</b>; and <b>SNS</b> notifies the student's wallet of a successful delivery. "
            "This synergy is what makes the blockchain experience feel seamless and instantaneous."
        )
        data = [[Paragraph(arch_txt, body_style), arch_img]]
        t = Table(data, colWidths=[4*inch, 2*inch])
        story.append(t)
    
    story.append(PageBreak())

    # ─── PAGE 3-4: THE PILLARS ───
    for pillar in PILLARS:
        story.append(Paragraph(pillar["title"], pillar_title_style))
        story.append(Paragraph(pillar["service"], service_label))
        
        # Icon and Text Table
        if os.path.exists(pillar["icon"]):
            img = Image(pillar["icon"], 0.8*inch, 0.8*inch)
            data = [[img, Paragraph(pillar["body"], body_style)]]
            t = Table(data, colWidths=[1*inch, 5.5*inch])
            t.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('TOPPADDING', (0,0), (-1,-1), 0)]))
            story.append(t)
        else:
            story.append(Paragraph(pillar["body"], body_style))
            
        story.append(Paragraph(f"<b>Real-World Benchmark:</b> {pillar['real_world']}", real_world_style))
        story.append(Spacer(1, 0.4*inch))

    # Security Conclusion
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("The Security Promise", executive_title))
    if os.path.exists(IMAGES["SECURITY"]):
        sec_img = Image(IMAGES["SECURITY"], 0.6*inch, 0.6*inch)
        sec_img.hAlign = 'LEFT'
        sec_txt = (
            "CampusChain's primary mission is the elimination of credential fraud. By utilizing AWS-hardened "
            "infrastructure, we achieve a layer of security that traditional university databases cannot match. "
            "Every interaction is encrypted, signed, and monitored, ensuring that the 'Chain of Trust' remains "
            "unbroken from the registrar to the employer."
        )
        data = [[sec_img, Paragraph(sec_txt, body_style)]]
        t = Table(data, colWidths=[0.8*inch, 5.5*inch])
        story.append(t)

    # Build PDF
    doc.build(story)
    print(f"Successfully generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    create_v3_pdf()
