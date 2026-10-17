// Navigation and form behavior. Page content lives in index.html.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(isOpen));
  navigation.classList.toggle('is-open', isOpen);
});
navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  navigation.querySelectorAll('a').forEach((item) => item.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'page');
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
});
document.querySelector('#year').textContent = new Date().getFullYear();

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  button.disabled = true;
  status.textContent = 'Sending your inquiry…';
  try {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'), company: data.get('company'),
        email: data.get('email'), message: data.get('message'),
        consent: data.get('consent') === 'on',
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to send your inquiry.');
    status.textContent = result.message;
    form.reset();
  } catch (error) {
    status.textContent = error instanceof TypeError
      ? 'Unable to connect. Please try again shortly.' : error.message;
  } finally {
    button.disabled = false;
  }
});
