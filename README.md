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

- The contact form uses client-side validation and submits through `/api/contact`.
  Configure the server-side environment variables shown in `.env.example`.
- The root `robots.txt` and `sitemap.xml` contain placeholder URLs and are not
  copied into the Vite build output. Configure the production domain and make
  these files available at the site root before deploying.
- Placeholder business details can be updated centrally in `js/main.js`.
- Demo portfolio imagery uses royalty-free Unsplash images to keep the site visually rich without requiring local asset files.
