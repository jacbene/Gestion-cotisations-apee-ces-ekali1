/* public/api.js
   Client API helper + auth + offline sync queue
   Include this file in index.html before script.js:
   <script src="api.js"></script>
   It exposes `window.api` with helper methods.
*/

(function (window) {
  const ORIGIN = window.location.origin;
  // If frontend is served by the backend, use same origin + /api
  const API_BASE = (ORIGIN && ORIGIN !== 'null') ? ORIGIN + '/api' : 'http://localhost:3000/api';

  function getToken() {
    return localStorage.getItem('apee_jwt') || null;
  }
  function setToken(token) {
    if (token) localStorage.setItem('apee_jwt', token);
    else localStorage.removeItem('apee_jwt');
  }

  async function apiFetch(path, opts = {}) {
    const url = API_BASE + path;
    const headers = opts.headers || {};
    headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(url, { ...opts, headers });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API error ${res.status}: ${txt}`);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (err) {
      // bubble up to caller
      throw err;
    }
  }

  async function login(username, password) {
    const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (res && res.token) {
      setToken(res.token);
      return res.user || null;
    }
    throw new Error('Login failed');
  }

  function logout() {
    setToken(null);
  }

  function pushToSyncQueue(item) {
    const queue = JSON.parse(localStorage.getItem('apee_sync_queue') || '[]');
    queue.push(item);
    localStorage.setItem('apee_sync_queue', JSON.stringify(queue));
  }

  async function processSyncQueue() {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('apee_sync_queue') || '[]');
    if (!queue.length) return;
    for (const item of queue) {
      try {
        if (item.type === 'create_payment') {
          await apiFetch('/paiements', { method: 'POST', body: JSON.stringify(item.payload) });
        }
        // handle updates/deletes later
      } catch (err) {
        console.warn('Sync failed for item', item, err);
        return; // keep remaining queue
      }
    }
    localStorage.removeItem('apee_sync_queue');
    if (typeof window.api.onSyncComplete === 'function') window.api.onSyncComplete();
  }

  async function sendSMS(to, body) {
    return await apiFetch('/send-sms', { method: 'POST', body: JSON.stringify({ to, body }) });
  }

  window.api = {
    apiFetch,
    login,
    logout,
    getToken,
    pushToSyncQueue,
    processSyncQueue,
    sendSMS,
    onSyncComplete: null
  };

  window.addEventListener('online', () => {
    setTimeout(() => {
      window.api.processSyncQueue().catch(e => console.error('Sync queue error', e));
    }, 1000);
  });
})(window);
