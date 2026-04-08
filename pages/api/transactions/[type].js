import { requireAuth } from '../../../lib/auth';
import { FeePaymentContract } from '../../../lib/contracts/FeePaymentContract';
import { P2PTransferContract } from '../../../lib/contracts/P2PTransferContract';
import { VendorPaymentContract } from '../../../lib/contracts/VendorPaymentContract';
import { EventTicketContract } from '../../../lib/contracts/EventTicketContract';
import { detectFraud } from '../../../lib/fraudDetection';
import { logTransferEvent, logApiEvent } from '../../../lib/cloudwatch';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type } = req.query;
  const userId = req.user.id;
  const userName = req.user.name || req.user.email;
  const startTime = Date.now();

  try {
    // Run fraud check first (non-blocking — just flags)
    const { amount, toId, vendorId } = req.body;
    if (amount) {
      const fraud = await detectFraud({
        userId,
        amount: Number(amount),
        type,
        toUser: toId || vendorId,
        userName,
      });
      if (fraud.isSuspect && fraud.severity === 'high') {
        // Log the blocked request to CloudWatch
        await logApiEvent(`/api/transactions/${type}`, userId, 400, Date.now() - startTime, {
          blocked: true, reason: 'fraud_high_severity',
        });
        return res.status(400).json({ error: 'Transaction flagged by fraud detection system. Contact admin.', fraud });
      }
    }

    let result;

    switch (type) {
      case 'fee-payment': {
        const { amount: amt, feeType } = req.body;
        result = await FeePaymentContract({ userId, amount: Number(amt), feeType });
        break;
      }
      case 'send': {
        const { toId: to, amount: amt2, memo } = req.body;
        result = await P2PTransferContract({ fromId: userId, toId: to, amount: Number(amt2), memo });
        break;
      }
      case 'vendor': {
        const { vendorId: vid, amount: amt3, qrData } = req.body;
        result = await VendorPaymentContract({ vendorId: vid, studentId: userId, amount: Number(amt3), qrData });
        break;
      }
      case 'buy-ticket': {
        const { eventId, ticketCount } = req.body;
        result = await EventTicketContract({ eventId, studentId: userId, ticketCount: Number(ticketCount || 1) });
        break;
      }
      default:
        return res.status(404).json({ error: 'Unknown transaction type' });
    }

    const duration = Date.now() - startTime;

    // AWS: Emit CloudWatch metric & log for successful transaction (fire-and-forget)
    logTransferEvent(userId, Number(amount || 0), type, result?.txId || result?.tx_id || 'unknown')
      .catch(err => console.error('[CW] Transfer log error:', err.message));

    logApiEvent(`/api/transactions/${type}`, userId, 200, duration)
      .catch(err => console.error('[CW] API log error:', err.message));

    return res.json({ success: true, ...result });
  } catch (err) {
    // Log error to CloudWatch
    logApiEvent(`/api/transactions/${type}`, userId, 500, Date.now() - startTime, {
      error: err.message,
    }).catch(() => {});

    return res.status(400).json({ error: err.message });
  }
}

export default requireAuth(handler);
