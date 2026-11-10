# SeaTechMedia Corporate Portfolio Website

A premium static corporate website for SeaTechMedia, designed to showcase creative media, digital marketing, event management, equipment solutions, and IT services.

## Structure

- `index.html` – static main landing page with a React-mounted navigation
- `components/ui/liquid-glass-navbar.tsx` – reusable liquid-glass navigation component
- `src/` – React entry point and Tailwind utility entry
- `css/style.css` and `css/responsive.css` – existing site styling and responsive adjustments
- `js/main.js` – existing interactions for navigation, portfolio filters, FAQ, contact form, and more
- `pages/privacy-policy.html` and `pages/terms.html` – static legal pages

## Run locally

Install dependencies and start Vite from the project directory:

```bash
npm install
npm run dev
```

Vite prints the local URL. To create and preview a production build:

```bash
npm run build
npm run preview
```

The build runs the TypeScript check before bundling. With a Node.js version
that supports TypeScript type stripping, run the existing unit tests with:

```bash
node --test tests/work-deck.test.ts
```

## Preparing for GitHub

Commit the source files, `package.json`, and `package-lock.json`; dependencies and
the production build can be recreated with `npm install` and `npm run build`.
The `.gitignore` also excludes local environment files, reference recordings,
and unused logo-reveal copies. These files remain on your computer. Use
`.env.example` as the template for local environment settings.

## Notes

- The contact form uses client-side validation and POSTs to `/api/contact`.
  The shared handler sends via Resend from `inquiries@contact.seatechmedia.com`
  to `seatechp@gmail.com`, with the customer's email as Reply-To. Resend
  acceptance is not a guarantee of delivery. If sending cannot be confirmed,
  the form offers an optional email-app link; it does not open it automatically.
- Set `RESEND_API_KEY` as a **secret**, not a public variable or a `VITE_`
  variable. For local Vite development, put it in the ignored `.env` file.
  Never commit the key. `RESEND_FROM` and `CONTACT_TO` are not used.
- For a Cloudflare Pages Git deployment, build with `npm run build`, set the
  build output directory to `dist`, and configure `RESEND_API_KEY` as an
  encrypted secret in the Pages project settings for each needed environment.
  Pages builds the root `functions/api/contact.js` as a Worker route; it is
  not part of `dist`. Redeploy after setting the secret. Dashboard direct
  upload does not support Pages Functions; use Git integration or Wrangler
  Pages deployment with the root `functions` directory instead.
- For a Cloudflare Worker with static assets, integrate `worker.js` as the
  Worker entry point and bind `dist` as `ASSETS`. Configure Worker-first routing
  for `/api/contact` so POST reaches the Worker rather than static assets, for
  example with these fields in the existing Wrangler configuration:

  ```json
  {
    "main": "worker.js",
    "assets": {
      "directory": "./dist",
      "binding": "ASSETS",
      "run_worker_first": ["/api/contact"]
    }
  }
  ```

  Set `RESEND_API_KEY` with `wrangler secret put RESEND_API_KEY` for the
  correct Worker/environment, then deploy the Worker and its built assets.
  Preserve any existing Worker routes and bindings when integrating this entry
  point. The in-memory rate limit is best-effort per isolate; use Cloudflare
  WAF rate limiting for a shared production limit.
- After deployment, submit a test inquiry and check the POST response, Resend
  delivery activity, the Gmail inbox and Reply-To. A 405 or an HTML response
  indicates that the API route is not deployed or is not receiving the request.
  Run `node --test tests/contact-api.test.js` for the local handler regression tests.
- The root `robots.txt` and `sitemap.xml` contain placeholder URLs and are not
  copied into the Vite build output. Configure the production domain and make
  these files available at the site root before deploying.
- Placeholder business details can be updated centrally in `js/main.js`.
- Demo portfolio imagery uses royalty-free Unsplash images to keep the site visually rich without requiring local asset files.
