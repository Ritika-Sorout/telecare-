/* Doctor dashboard: triage-ordered queue, start/complete actions, escalation alerts. */
const qBody = document.getElementById('qBody');
const escBanner = document.getElementById('escBanner');

async function refresh() {
  try {
    const [queue, stats] = await Promise.all([api('/api/queue'), api('/api/stats')]);
    renderTable(queue);
    renderStats(stats);
  } catch (e) {
    qBody.innerHTML = '<tr><td colspan="7" class="muted">Cannot reach the triage service on :4000.</td></tr>';
  }
}

function renderTable(queue) {
  document.getElementById('qCount').textContent = `· ${queue.length} waiting`;
  document.getElementById('emptyMsg').style.display = queue.length ? 'none' : 'block';
  qBody.innerHTML = '';
  queue.forEach((q, i) => {
    const tr = document.createElement('tr');
    if (q.tier === 'critical') tr.className = 'critical-row';
    const inConsult = q.status === 'in-consultation';
    tr.innerHTML = `
      <td><strong>${i + 1}</strong></td>
      <td>${esc(q.name)}<br><small class="muted">age ${q.age}</small></td>
      <td class="hide-sm"><small>${q.symptoms.map(symptomLabel).join(', ')}</small></td>
      <td><strong>${q.score}</strong></td>
      <td>${tierBadge(q.tier)}</td>
      <td>${inConsult ? '🟢 in consultation' : '⏳ waiting'}</td>
      <td class="actions">
        ${inConsult
          ? `<button class="btn small" data-act="complete" data-id="${q.id}">Complete</button>`
          : `<button class="btn small" data-act="start" data-id="${q.id}">Start</button>`}
      </td>`;
    qBody.appendChild(tr);
  });
}

function renderStats(s) {
  document.getElementById('stats').innerHTML = `
    <div><div class="bignum" style="font-size:2rem">${s.total}</div><div class="muted">in queue</div></div>
    <div><div class="bignum" style="font-size:2rem;color:var(--critical)">${s.byTier.critical || 0}</div><div class="muted">critical</div></div>
    <div><div class="bignum" style="font-size:2rem">${s.avgWaitMin}</div><div class="muted">avg wait (min)</div></div>`;
}

// Event delegation: one listener for all Start/Complete buttons.
qBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const { act, id } = btn.dataset;
  await api(`/api/queue/${id}/${act}`, { method: 'POST' }).catch(() => {});
  // No manual re-render needed — the server broadcasts the new queue.
});

socket.on('queue:update', (queue) => {
  renderTable(queue);
  api('/api/stats').then(renderStats).catch(() => {});
});

// Critical bookings trigger an instant escalation banner + sound-free flash.
socket.on('escalation', (entry) => {
  escBanner.textContent = `🚨 Critical case escalated: ${esc(entry.name)} (score ${entry.score}) — moved to top of queue.`;
  escBanner.classList.add('show');
  setTimeout(() => escBanner.classList.remove('show'), 12000);
});

refresh();
