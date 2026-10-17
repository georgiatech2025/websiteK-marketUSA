import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = process.env.DATA_DIRECTORY || path.join(root, 'data');
mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
const database = new DatabaseSync(path.join(dataDirectory, 'contacts.sqlite'));
database.exec(`CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
const insertContact = database.prepare(
  'INSERT INTO contacts (name, email, company, message) VALUES (?, ?, ?, ?)',
);
const publicFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function saveContact(request, response) {
  if (!request.headers['content-type']?.startsWith('application/json')) {
    return sendJson(response, 415, { error: 'Please send JSON form data.' });
  }
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 10000) {
      return sendJson(response, 413, { error: 'Your message is too long.' });
    }
  }
  let input;
  try { input = JSON.parse(body); } catch {
    return sendJson(response, 400, { error: 'Invalid form data.' });
  }
  const limits = { name: 100, email: 254, company: 150, message: 3000 };
  const contact = {};
  for (const [field, limit] of Object.entries(limits)) {
    if (typeof input?.[field] !== 'string' || !input[field].trim() || input[field].trim().length > limit) {
      return sendJson(response, 400, { error: `Please enter a valid ${field} (maximum ${limit} characters).` });
    }
    contact[field] = input[field].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || input.consent !== true) {
    return sendJson(response, 400, { error: 'Enter a valid email and agree to be contacted.' });
  }
  insertContact.run(contact.name, contact.email, contact.company, contact.message);
  sendJson(response, 201, { message: 'Thank you! Your inquiry has been saved.' });
}

export const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/api/contacts' && request.method === 'POST') {
      return await saveContact(request, response);
    }
    const file = publicFiles[pathname];
    if (!file || !['GET', 'HEAD'].includes(request.method)) {
      return sendJson(response, 404, { error: 'Page not found.' });
    }
    const content = await readFile(path.join(root, 'public', file[0]));
    response.writeHead(200, { 'Content-Type': file[1] });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    console.error('Request failed:', error.message);
    if (!response.headersSent) sendJson(response, 500, { error: 'Something went wrong. Please try again.' });
    else response.end();
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '0.0.0.0', () => console.log(`K-Market USA server listening on port ${port}`));
}
