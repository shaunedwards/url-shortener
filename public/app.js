const form = document.querySelector('form');
const message = document.querySelector('#message');
form.addEventListener('submit', async () => {
  message.className = '';
  const urlVal = document.querySelector('#url').value;
  const slugVal = document.querySelector('#slug').value;
  const response = await fetch('http://localhost:5555', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: urlVal,
      slug: slugVal
    })
  });
  const { slug, error } = await response.json();
  if (response.ok) {
    message.classList.add('success');
    message.innerText = `http://localhost:5555/${slug}`;
  } else {
    message.classList.add('error');
    message.innerText = error;
  }
  form.reset();
  document.querySelector('#url').focus();
});

message.addEventListener('click', () => {
  copyToClipboard(message.innerText);
});

const copyToClipboard = (str) => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}
