const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Strips control characters (blocks header/log injection) and collapses single-line fields.
const clean = (value, max, multiline = false) => {
  if (typeof value !== 'string') return '';
  const stripped = value.replace(
    multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g,
    ' ',
  );
  return stripped.trim().slice(0, max);
};

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
const MAX_BODY_BYTES = 20 * 1024;

// Best-effort in-memory limiter (per server instance). Use a shared store such as
// Upstash/Redis if you need a hard limit across serverless instances.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map();

const getClientIp = (req) => {
  const forwarded = req.headers?.['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
};

const isRateLimited = (ip) => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
  const entry = hits.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  entry.count += 1;
  hits.set(ip, entry);
  return entry.count > MAX_REQUESTS ? Math.ceil((entry.resetAt - now) / 1000) : 0;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (origin && host) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      /* invalid origin falls through to rejection */
    }
    if (originHost !== host) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const retryAfter = isRateLimited(getClientIp(req));
  if (retryAfter) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    if (body.length > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Request too large.' });
    }
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid request body.' });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const service = clean(body.service, 120);
  const budget = clean(body.budget, 120);
  const message = clean(body.message, 5000, true);

  if (!fullName || !EMAIL_RE.test(email) || !message) {
    return res.status(400).json({ error: 'Name, a valid email and a message are required.' });
  }

  const rows = [
    ['Name', fullName],
    ['Email', email],
    ['Phone', phone || 'Not provided'],
    ['Service', service || 'Not specified'],
    ['Budget', budget || 'Not specified'],
  ];

  const html = `
    <h2>New inquiry from ${escapeHtml(fullName)}</h2>
    <table cellpadding="6">${rows
      .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`)
      .join('')}</table>
    <h3>Project details</h3>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  const text = [...rows.map(([k, v]) => `${k}: ${v}`), '', 'Project details:', message].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'SeaTechMedia <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO || 'seatechp@gmail.com'],
      reply_to: email,
      subject: `SeaTechMedia inquiry from ${fullName}`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    return res.status(502).json({ error: 'Could not send the inquiry.' });
  }

  return res.status(200).json({ ok: true });
}
