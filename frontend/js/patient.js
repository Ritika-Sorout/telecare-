/* Patient flow: symptom intake form → booking → live waiting room. */
const chipsEl = document.getElementById('symptomChips');
const selected = new Set();

// Render tappable symptom chips; tapping toggles membership in `selected`.
SYMPTOMS.forEach(([key, label]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = label;
  b.onclick = () => {
    selected.has(key) ? selected.delete(key) : selected.add(key);
    b.classList.toggle('on');
  };
  chipsEl.appendChild(b);
});

let myId = null;

document.getElementById('bookBtn').onclick = async () => {
  const name = document.getElementById('pname').value.trim();
  const msg = document.getElementById('formMsg');
  if (!name) { msg.textContent = 'Please enter your name.'; return; }
  if (selected.size === 0) { msg.textContent = 'Please select at least one symptom.'; return; }

  const comorbidities = [...document.querySelectorAll('.comorb:checked')].map(c => c.value);
  msg.textContent = 'Booking…';

  try {
    // POST the structured intake to the Node triage service.
    // The server scores it, inserts it into the sorted queue, and
    // broadcasts the new order to every connected screen.
    const entry = await api('/api/intake', {
      method: 'POST',
      body: JSON.stringify({
        name,
        age: +document.getElementById('page').value || 30,
        symptoms: [...selected],
        comorbidities,
        durationHours: +document.getElementById('duration').value,
      }),
    });
    myId = entry.id;
    document.getElementById('meName').textContent = entry.name;
    document.getElementById('intakeCard').classList.add('hidden');
    document.getElementById('waitingCard').classList.remove('hidden');
    renderQueue(entry.queue);
  } catch (e) {
    msg.textContent = 'Could not reach the triage service. Is it running on :4000?';
  }
};

document.getElementById('leaveBtn').onclick = async () => {
  if (myId) await api('/api/queue/' + myId, { method: 'DELETE' }).catch(() => {});
  location.reload();
};

// Every queue change arrives here live — no polling, no refresh.
socket.on('queue:update', renderQueue);

function renderQueue(queue) {
  const list = document.getElementById('queueList');
  list.innerHTML = '';
  const idx = queue.findIndex(q => q.id === myId);

  queue.forEach((q, i) => {
    const li = document.createElement('li');
    if (q.id === myId) li.className = 'me';
    li.innerHTML = `
      <span class="pos">${i + 1}</span>
      <span class="who"><strong>${esc(q.name)}${q.id === myId ? ' (you)' : ''}</strong>
      <small>${q.symptoms.map(symptomLabel).slice(0, 3).join(', ')}</small></span>
      ${tierBadge(q.tier)}
      <span class="eta">~${q.etaMin} min</span>`;
    list.appendChild(li);
  });

  if (idx >= 0) {
    document.getElementById('myPos').textContent = '#' + (idx + 1);
    document.getElementById('myTier').innerHTML = tierBadge(queue[idx].tier);
    document.getElementById('myEta').textContent = '~' + queue[idx].etaMin + ' min';
  } else if (myId) {
    // I'm no longer in the queue — consultation started or finished.
    document.getElementById('myPos').textContent = '✓';
    document.getElementById('myEta').textContent = 'done';
  }
}

// If the page loads mid-queue (e.g. refresh), just show the current order.
api('/api/queue').then(q => { if (myId) renderQueue(q); }).catch(() => {});
