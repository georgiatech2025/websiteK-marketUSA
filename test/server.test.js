import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

test('website serves pages, validates inquiries, and stores valid contacts privately', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'kmarket-test-'));
  process.env.DATA_DIRECTORY = directory;
  const { server } = await import('../server.js');
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const submit = (body) => fetch(`${base}/api/contacts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /id="contact-form"/);
    for (const asset of ['/styles.css', '/app.js']) assert.equal((await fetch(base + asset)).status, 200);
    const valid = { name: 'Test Person', company: 'Test Company', email: 'test@example.com', message: 'Interested in US campaigns.', consent: true };
    assert.equal((await submit({ ...valid, email: 'invalid' })).status, 400);
    assert.equal((await submit({ ...valid, consent: false })).status, 400);
    assert.equal((await submit({ ...valid, name: '' })).status, 400);
    assert.equal((await submit({ ...valid, message: 'x'.repeat(10001) })).status, 413);
    assert.equal((await submit(valid)).status, 201);
    const database = new DatabaseSync(path.join(directory, 'contacts.sqlite'), { readOnly: true });
    const rows = database.prepare('SELECT * FROM contacts').all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, valid.email);
    database.close();
    assert.equal((await fetch(`${base}/data/contacts.sqlite`)).status, 404);
    assert.equal((await fetch(`${base}/api/contacts`)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
