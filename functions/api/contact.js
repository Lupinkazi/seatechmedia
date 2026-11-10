import { handleContact } from '../../lib/contact-api.js';

export function onRequest({ request, env }) {
  return handleContact(request, env);
}
