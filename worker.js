import { handleContact } from './lib/contact-api.js';

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname === '/api/contact') {
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
