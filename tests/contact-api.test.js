import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../lib/contact-api.js';
import { onRequest } from '../functions/api/contact.js';
import worker from '../worker.js';
import nodeHandler from '../api/contact.js';

const inquiry = {
  fullName: 'Test <Customer>',
  email: 'customer@example.com',
  phone: '123456789',
  service: 'Website Development',
  budget: '1000',
  message: 'Hello <team>',
};
let ip = 0;
const request = (body = inquiry, options = {}) => new Request('https://example.com/api/contact', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': `test-${++ip}`, ...options.headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
  ...options,
});

test('Pages and Worker routes send one correctly addressed Resend email', async () => {
  const originalFetch = globalThis.fetch;
  const sends = [];
  globalThis.fetch = async (url, options) => {
    sends.push({ url, options, body: JSON.parse(options.body) });
    return Response.json({ id: 'accepted-id' });
  };
  try {
    for (const invoke of [
      (req) => onRequest({ request: req, env: { RESEND_API_KEY: 'test-secret' } }),
      (req) => worker.fetch(req, { RESEND_API_KEY: 'test-secret' }),
    ]) {
      const response = await invoke(request());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    }
    assert.equal(sends.length, 2);
    for (const { url, options, body } of sends) {
      assert.equal(url, 'https://api.resend.com/emails');
      assert.equal(options.headers.Authorization, 'Bearer test-secret');
      assert.equal(body.from, 'SeaTechMedia <inquiries@contact.seatechmedia.com>');
      assert.deepEqual(body.to, ['seatechp@gmail.com']);
      assert.equal(body.reply_to, inquiry.email);
      for (const value of Object.values(inquiry)) assert.ok(body.text.includes(value));
      assert.ok(body.html.includes('&lt;Customer&gt;'));
      assert.ok(body.html.includes('&lt;team&gt;'));
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects invalid methods, origins, bodies, and missing configuration', async () => {
  const env = { RESEND_API_KEY: 'test-secret' };
  const get = await handleContact(new Request('https://example.com/api/contact'), env);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
  assert.equal((await handleContact(request(inquiry, { headers: { origin: 'https://other.example' } }), env)).status, 403);
  assert.equal((await handleContact(request('{'), env)).status, 400);
  assert.equal((await handleContact(request({ ...inquiry, email: 'invalid' }), env)).status, 400);
  assert.equal((await handleContact(request('x'.repeat(20 * 1024 + 1)), env)).status, 413);
  assert.equal((await handleContact(request(), {})).status, 500);
});

test('does not report success on Resend rejection, network failure, or missing acceptance ID', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const fetchMock of [
      async () => new Response(null, { status: 403 }),
      async () => { throw new Error('network'); },
      async () => Response.json({}),
      async () => new Response('not json'),
    ]) {
      globalThis.fetch = fetchMock;
      const response = await handleContact(request(), { RESEND_API_KEY: 'test-secret' });
      assert.equal(response.status, 502);
      assert.equal((await response.json()).ok, undefined);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rate limits repeated submissions for one client', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ id: 'accepted-id' });
  try {
    for (let count = 0; count < 5; count++) {
      const response = await handleContact(request(inquiry, { headers: { 'cf-connecting-ip': 'limit-test' } }), { RESEND_API_KEY: 'test-secret' });
      assert.equal(response.status, 200);
    }
    const response = await handleContact(request(inquiry, { headers: { 'cf-connecting-ip': 'limit-test' } }), { RESEND_API_KEY: 'test-secret' });
    assert.equal(response.status, 429);
    assert.ok(response.headers.get('retry-after'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Vercel adapter uses the shared handler', async () => {
  const originalFetch = globalThis.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'test-secret';
  globalThis.fetch = async () => Response.json({ id: 'accepted-id' });
  const result = {};
  const res = {
    setHeader() {},
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; },
  };
  try {
    await nodeHandler({ method: 'POST', headers: { host: 'example.com', 'cf-connecting-ip': 'node-test' }, body: inquiry }, res);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldKey;
  }
});

test('Worker passes non-API requests to static assets', async () => {
  const response = await worker.fetch(new Request('https://example.com/'), {
    ASSETS: { fetch: () => new Response('static asset') },
  });
  assert.equal(await response.text(), 'static asset');
});
