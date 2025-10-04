import type { NotificationJob } from '../notifications/notifications.service';

export function render(job: NotificationJob) {
  const subject = renderSubject(job);
  const text = renderText(job);
  const html = wrapHtml(`<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`);
  return { subject, text, html };
}

function renderSubject(job: NotificationJob) {
  switch (job.kind) {
    case 'order_paid':
      return `Payment received for order ${job.data.publicRef ?? job.data.orderId}`;
    case 'delivery_assigned':
      return `Driver assigned for order ${job.data.publicRef ?? job.data.orderId}`;
    case 'delivery_delivered':
      return `Delivery complete for order ${job.data.publicRef ?? job.data.orderId}`;
    case 'payout_sent':
      return `Payout initiated: ${fmt(job.data.amount, job.data.currency)}`;
    default:
      return 'Notification';
  }
}

function renderText(job: NotificationJob) {
  const n = job.to.name ? `${job.to.name}, ` : '';
  switch (job.kind) {
    case 'order_paid':
      return `${n}your payment of ${fmt(job.data.amount, job.data.currency)} was received. Ref: ${job.data.publicRef ?? job.data.orderId}.`;
    case 'delivery_assigned':
      return `${n}a driver has been assigned. Track here: ${job.data.trackUrl ?? ''}`.trim();
    case 'delivery_delivered':
      return `${n}your delivery is complete. Ref: ${job.data.publicRef ?? job.data.orderId}.`;
    case 'payout_sent':
      return `${n}your payout of ${fmt(job.data.amount, job.data.currency)} has been sent. Ref: ${job.data.reference}.`;
    default:
      return `${n}update available.`;
  }
}

function wrapHtml(inner: string) {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;line-height:1.5">
  <div style="max-width:560px;margin:0 auto;padding:16px 12px">
    <div style="padding:12px 16px;border:1px solid #eee;border-radius:8px">
      <div style="font-weight:700;font-size:16px;margin-bottom:8px">HEFA</div>
      ${inner}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <div style="font-size:12px;color:#666">You’re receiving this because you have a HEFA account or transaction.</div>
    </div>
  </div></body></html>`;
}

function fmt(amount?: number, currency?: string) {
  if (amount == null) return '';
  const a = (amount / 100).toFixed(2);
  return `${currency ?? ''} ${a}`;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string,
  );
}
