/**
 * EmailJS Receipt Sender
 * Sends payment confirmation emails using EmailJS (client-side, no SMTP needed)
 *
 * Template variables your EmailJS template should use:
 * {{to_email}}       - recipient email
 * {{to_name}}        - recipient name
 * {{tx_id}}          - transaction hash
 * {{tx_type}}        - e.g. "Fee Payment", "P2P Transfer"
 * {{amount}}         - e.g. "500.00 CC"
 * {{block_number}}   - block number
 * {{timestamp}}      - formatted date/time
 * {{from_name}}      - sender name
 * {{to_wallet}}      - recipient wallet/student ID
 * {{balance_after}}  - updated balance
 * {{status}}         - "CONFIRMED"
 */

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export function isEmailConfigured() {
  return (
    SERVICE_ID && SERVICE_ID !== 'your_service_id_here' &&
    TEMPLATE_ID && TEMPLATE_ID !== 'your_template_id_here' &&
    PUBLIC_KEY && PUBLIC_KEY !== 'your_public_key_here'
  );
}

export async function sendReceiptEmail({
  toEmail,
  toName,
  txId,
  txType,
  amount,
  blockNumber,
  fromName,
  toWalletId,
  balanceAfter,
}) {
  if (!isEmailConfigured()) {
    console.warn('[EmailJS] Keys not configured — skipping receipt email');
    return { skipped: true };
  }

  try {
    // Dynamically import emailjs to avoid SSR issues
    const emailjs = (await import('@emailjs/browser')).default;

    const timestamp = new Date().toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const templateParams = {
      to_email: toEmail,
      to_name: toName || 'CampusChain User',
      tx_id: txId || 'N/A',
      tx_type: txType || 'Transaction',
      amount: `${Number(amount).toFixed(2)} CC`,
      block_number: blockNumber ? `#${blockNumber}` : 'Pending',
      timestamp,
      from_name: fromName || 'CampusChain System',
      to_wallet: toWalletId || 'N/A',
      balance_after: balanceAfter !== undefined ? `${Number(balanceAfter).toFixed(2)} CC` : 'N/A',
      status: 'CONFIRMED ✅',
    };

    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('[EmailJS] Receipt sent:', result.status);
    return { success: true, status: result.status };
  } catch (err) {
    console.error('[EmailJS] Failed to send receipt:', err);
    return { success: false, error: err.message };
  }
}
