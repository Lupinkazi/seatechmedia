const MAX_BODY_BYTES = 20 * 1024;
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map();

const json = (body, status, headers = {}) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
});

const clean = (value, max, multiline = false) => {
  if (typeof value !== 'string') return '';
  return value.replace(
    multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g,
    ' ',
  ).trim().slice(0, max);
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

// Best-effort per-isolate limit; Cloudflare WAF is needed for a shared limit.
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

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function handleContact(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return json({ error: 'Forbidden' }, 403);
      }
    } catch {
      return json({ error: 'Forbidden' }, 403);
    }
  }

  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown';
  const retryAfter = isRateLimited(ip);
  if (retryAfter) {
    return json({ error: 'Too many requests. Please try again later.' }, 429, { 'Retry-After': String(retryAfter) });
  }

  let raw;
  try {
    raw = await readBody(request);
  } catch {
    return json({ error: 'Could not read request body.' }, 400);
  }
  if (raw === null) return json({ error: 'Request too large.' }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const service = clean(body.service, 120);
  const budget = clean(body.budget, 120);
  const message = clean(body.message, 5000, true);
  if (!fullName || !EMAIL_RE.test(email) || !message) {
    return json({ error: 'Name, a valid email and a message are required.' }, 400);
  }
  if (!env.RESEND_API_KEY) {
    console.error('Contact email service is not configured.');
    return json({ error: 'Email service is not configured.' }, 500);
  }

  const rows = [
    ['Name', fullName],
    ['Email', email],
    ['Phone', phone || 'Not provided'],
    ['Service', service || 'Not specified'],
    ['Budget', budget || 'Not specified'],
  ];
  const html = `<h2>New inquiry from ${escapeHtml(fullName)}</h2>
    <table cellpadding="6">${rows.map(([key, value]) => `<tr><td><strong>${key}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('')}</table>
    <h3>Project details</h3><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;
  const text = [...rows.map(([key, value]) => `${key}: ${value}`), '', 'Project details:', message].join('\n');

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SeaTechMedia <inquiries@contact.seatechmedia.com>',
        to: ['seatechp@gmail.com'],
        reply_to: email,
        subject: `SeaTechMedia inquiry from ${fullName}`,
        html,
        text,
      }),
    });
  } catch {
    console.error('Contact email request to Resend failed.');
    return json({ error: 'Could not send the inquiry.' }, 502);
  }
  if (!response.ok) {
    console.error(`Contact email rejected by Resend (HTTP ${response.status}).`);
    return json({ error: 'Could not send the inquiry.' }, 502);
  }
  let result;
  try {
    result = await response.json();
  } catch {
    console.error('Contact email response from Resend was invalid.');
    return json({ error: 'Could not confirm the inquiry was accepted.' }, 502);
  }
  if (typeof result?.id !== 'string' || !result.id) {
    console.error('Contact email response from Resend contained no email ID.');
    return json({ error: 'Could not confirm the inquiry was accepted.' }, 502);
  }
  return json({ ok: true }, 200);
}
