import os
import sys
import subprocess

try:
    import win32com.client
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pywin32', '-q'])
    import win32com.client

pptx_path = os.path.abspath("CampusChain_Presentation.pptx")
pdf_path = os.path.abspath("CampusChain_Presentation.pdf")

print(f"Converting {pptx_path} to {pdf_path} using win32com...")

try:
    powerpoint = win32com.client.DispatchEx("Powerpoint.Application")
    # 32 = ppSaveAsPDF
    deck = powerpoint.Presentations.Open(pptx_path, WithWindow=False)
    deck.SaveAs(pdf_path, 32)
    deck.Close()
    powerpoint.Quit()
    print(f"✅ Successfully converted to PDF: {pdf_path}")
except Exception as e:
    print(f"❌ Error during conversion: {e}")
