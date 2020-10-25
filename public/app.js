const form = document.querySelector('form');
form.addEventListener('submit', async () => {
  result.className = '';
  copy.style.display = 'none';
  const urlVal = document.querySelector('#url').value;
  const slugVal = document.querySelector('#slug').value;
  const response = await fetch('/', {
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
    result.classList.add('success');
    message.innerText = `${window.location.href}${slug}`;
    copy.style.display = 'block';
  } else {
    result.classList.add('error');
    message.innerText = error;
  }
  result.style.display = 'block';
  form.reset();
  document.querySelector('#url').focus();
});

copy.addEventListener('click', () => {
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
