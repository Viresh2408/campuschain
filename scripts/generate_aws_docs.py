from fpdf import FPDF
import os

class AWS_Doc_PDF(FPDF):
    def header(self):
        # Logo
        logo_path = r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748\campuschain_brand_logo_premium_1775666271295.png'
        if os.path.exists(logo_path):
            self.image(logo_path, 10, 8, 33)
        self.set_font('Helvetica', 'B', 15)
        self.cell(80)
        self.cell(30, 10, 'CampusChain AWS Infrastructure', 0, 0, 'C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title, icon_path=None):
        self.set_font('Helvetica', 'B', 14)
        self.set_fill_color(240, 240, 240)
        if icon_path and os.path.exists(icon_path):
            # Centering the icon slightly
            self.image(icon_path, x=10, y=self.get_y(), w=15)
            self.set_x(30)
        self.cell(0, 15, f"   {title}", 0, 1, 'L', fill=True)
        self.ln(5)

    def chapter_body(self, body):
        self.set_font('Helvetica', '', 11)
        self.multi_cell(0, 7, body)
        self.ln()

def generate():
    pdf = AWS_Doc_PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Introduction
    pdf.set_font('Helvetica', 'I', 12)
    pdf.multi_cell(0, 7, "This document outlines the Amazon Web Services (AWS) utilized by CampusChain to provide a secure, scalable, and resilient blockchain infrastructure for campus-wide digital credentials.")
    pdf.ln(10)

    services = [
        {
            "title": "Amazon EC2 (Elastic Compute Cloud)",
            "icon": r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748\aws_ec2_premium_icon_1775666117688.png',
            "content": (
                "1. Why we used it: To host the CampusChain core application (Next.js & Node.js). EC2 provides reliable uptime and scalable processing for blockchain node stabilization.\n\n"
                "2. Working: Virtual machines (Instances) partitioned by an hypervisor. We utilize AWS Linux/Ubuntu containers to run Dockerized services.\n\n"
                "3. Need & Real-World: Essential for constant availability. Real-world example: Netflix uses EC2 to handle varying traffic loads for millions of streamers simultaneously."
            )
        },
        {
            "title": "Amazon S3 (Simple Storage Service)",
            "icon": r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748\aws_s3_premium_icon_1775666134280.png',
            "content": (
                "1. Why we used it: For immutable storage of digital receipts and transaction artifacts created on the blockchain.\n\n"
                "2. Working: An object storage service that stores data in 'Buckets' with unique keys. It provides 99.999999999% durability.\n\n"
                "3. Need & Real-World: Ensures that user receipts are never lost or corrupted. Real-world example: Dropbox uses S3 backends for high-durability file storage."
            )
        },
        {
            "title": "Amazon SNS (Simple Notification Service)",
            "icon": r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748\aws_sns_premium_icon_1775666149679.png',
            "content": (
                "1. Why we used it: To trigger real-time security alerts when the CampusChain Fraud Engine detects suspicious activity.\n\n"
                "2. Working: A Pub/Sub messaging service. Messages are published to a 'Topic' and distributed to subscribers (Email, SMS, Lambda).\n\n"
                "3. Need & Real-World: Critical for immediate administrative response. Real-world example: Uber uses SNS to push ride updates and receipts to millions of users instantly."
            )
        },
        {
            "title": "Amazon CloudWatch (Logs & Metrics)",
            "icon": r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748\aws_cloudwatch_premium_icon_1775666169122.png',
            "content": (
                "1. Why we used it: For real-time monitoring of token transaction volume and system health metrics.\n\n"
                "2. Working: CloudWatch Logs captures application stack traces, while Metrics tracks numerical data like transaction throughput and error rates.\n\n"
                "3. Need & Real-World: Essential for identifying bottlenecks. Real-world example: Airbnb uses CloudWatch to monitor latencies across its global microservice network."
            )
        },
        {
            "title": "Amazon DynamoDB (NoSQL)",
            "icon": r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748\aws_dynamodb_premium_icon_1775666183654.png',
            "content": (
                "1. Why we used it: To maintain a high-speed audit log of fraud-related events and security detections.\n\n"
                "2. Working: A serverless Key-Value database that provides single-digit millisecond latency at any scale without managing servers.\n\n"
                "3. Need & Real-World: Provides fast retrieval of historical security logs. Real-world example: Amazon.com uses DynamoDB to manage high-velocity inventory data during Prime Day."
            )
        }
    ]

    for service in services:
        pdf.chapter_title(service["title"], service["icon"])
        pdf.chapter_body(service["content"])

    output_path = r'C:\Users\Viresh-\.gemini\antigravity\brain\66baa0fd-4bcf-456a-88d6-e5ec1e0c8748\CampusChain_AWS_Infrastructure.pdf'
    pdf.output(output_path)
    print(f"PDF generated at: {output_path}")

if __name__ == '__main__':
    generate()
