# K-Market USA

A responsive agency website for Korean businesses entering the United States. Plain HTML, CSS, and JavaScript with a Node.js backend and SQLite storage. No external packages or build step are needed.

## Run locally

Use Node.js 24 or newer.

```sh
npm start
```

The server listens on port 3000. Use `npm run dev` for automatic server restarts, and `npm test` to run integration tests. Set `PORT` to change the port. Set `DATA_DIRECTORY` to choose the database directory (defaults to `data/`).

## Edit the website

- `public/index.html`: content and five navigation sections: Home, Services, Our approach, About us, Contact. Change link text and section IDs together when renaming menus.
- `public/styles.css`: responsive layout and design tokens at the top for brand colors.
- `public/app.js`: mobile navigation and contact form behavior.
- `server.js`: static file serving, validation, and database access.
- `test/server.test.js`: API and persistence tests.

## Customer information

The contact form collects name, company, email, message, and consent to contact. Valid inquiries are saved in `data/contacts.sqlite`; they are not emailed. The database is excluded from Git and cannot be downloaded through the web server. No public customer-list endpoint is provided. An authenticated administrator dashboard and user accounts are future additions.

To inspect inquiries locally, use a trusted SQLite client or run:

```sh
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('data/contacts.sqlite', { readOnly: true }); console.table(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all()); db.close();"
```

Only run this in a private terminal: results contain personal information. Back up the database securely. To honor a deletion request, use a SQLite client to delete the appropriate row by ID. Define an appropriate retention policy before launch.

## Before a public launch

Configure HTTPS and persistent private database storage. Add abuse protection and rate limiting at the hosting layer, establish an appropriate privacy policy and retention process, and verify business copy and contact details. This initial version has no login, email delivery, advertising tracking, or Google Ads account integration. Agency services described on the page are editable introductory copy; no performance claims or partner certifications are implied.

## Globe artwork

The inline SVG in `public/index.html` uses public-domain Natural Earth 1:110m land geometry distributed by [world-atlas](https://github.com/topojson/world-atlas). It uses a Pacific-centered orthographic projection (180° longitude, 25° north), generated with d3-geo. The dashed great-circle route connects Seoul (126.978° E, 37.5665° N) and Los Angeles (118.2437° W, 34.0522° N). Shapes and markers share the same projection. Geometry is embedded locally; no map services, runtime packages, or external requests are required.

## Deploy to Render

The repository includes `render.yaml`, a Render Blueprint for a **paid Starter web service and a 1 GB persistent disk**. Review Render's current service and disk pricing before creating resources. It runs one Node.js instance; do not scale this SQLite setup across multiple instances.

1. Sign in to [Render](https://dashboard.render.com/) and connect the GitHub account with access to this repository.
2. Select **New → Blueprint**, select `georgiatech2025/websiteK-marketUSA`, and use branch `main`.
3. Review the service and disk, then create the Blueprint. The build runs `npm ci && npm test`; startup runs `npm start`.
4. Wait for a successful deployment and open the HTTPS address Render assigns. Add a custom domain under the service settings when ready; use the DNS records Render provides.
5. Submit a clearly labeled test inquiry. In the service's private Shell, inspect the database using the command below. Restart the service and verify the same inquiry remains. Do not print real customer records in shared logs.

```sh
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync(process.env.DATA_DIRECTORY + '/contacts.sqlite', { readOnly: true }); console.log(db.prepare('SELECT COUNT(*) AS count FROM contacts').get()); db.close();"
```

`DATA_DIRECTORY=/var/data` points SQLite at the persistent disk. Never remove that disk when redeploying. The database in your local checkout is **not** uploaded by Git or migrated automatically. Set up secure backups and verify restoration before accepting real customer data.

A successful deployment gives you a public HTTPS website, but does not implement the remaining launch protections: form rate limiting and spam prevention, an appropriate privacy policy and retention process, and monitoring. Complete those before promoting the site. There is no authenticated admin dashboard or email notification delivery yet.
