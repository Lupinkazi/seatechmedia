import { handleContact } from '../lib/contact-api.js';

export default async function handler(req, res) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  const method = req.method || 'GET';
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  const request = new Request(`https://${headers.get('host') || 'localhost'}/api/contact`, {
    method,
    headers,
    ...(method === 'GET' || method === 'HEAD' ? {} : { body }),
  });
  const response = await handleContact(request, process.env);
  for (const [name, value] of response.headers) res.setHeader(name, value);
  res.status(response.status).json(await response.json());
}
