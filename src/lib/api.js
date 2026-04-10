const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (!import.meta.env.DEV) return '/api';
  return `http://${window.location.hostname}:3001/api`;
};
const API_BASE = getApiBase();

// Get Firebase auth token if user is signed in
async function getAuthHeaders() {
  try {
    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    }
  } catch {}
  return { 'Content-Type': 'application/json' };
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

export async function registerMedia({ sha256, dHash, filename, fileSize, mimeType, userId, userName, userPhoto, attestationNote, deviceInfo }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sha256, dHash, filename, fileSize, mimeType, userId, userName, userPhoto, attestationNote, deviceInfo }),
  });
  const data = await res.json().catch(() => ({}));
  // Return duplicate info instead of throwing — let the UI handle it
  if (res.status === 409) return { error: data.error, block: data.block, similarity: data.similarity, existingRecord: data.existingRecord };
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data;
}

export async function verifyMedia({ sha256, dHash, source }) {
  const headers = await getAuthHeaders();
  return request(`${API_BASE}/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sha256, dHash, source }),
  });
}

export async function getChain() {
  return request(`${API_BASE}/chain`);
}

export async function getMyMedia(userId) {
  return request(`${API_BASE}/my-media/${userId}`);
}

export async function getActivity() {
  return request(`${API_BASE}/activity`);
}

export async function getBlock(sha256) {
  return request(`${API_BASE}/block/${sha256}`);
}

export async function registerByUrl({ url, userId, userName, userPhoto, attestationNote }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/register-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, userId, userName, userPhoto, attestationNote }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) return { error: data.error, existingRecord: data.existingRecord, sha256: data.sha256 };
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data;
}

// ── Tier 3 APIs ──

export async function coAttest({ sha256, note }) {
  const headers = await getAuthHeaders();
  return request(`${API_BASE}/co-attest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sha256, note }),
  });
}

export async function transferCustody({ sha256, toEmail, note }) {
  const headers = await getAuthHeaders();
  return request(`${API_BASE}/transfer-custody`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sha256, toEmail, note }),
  });
}

export async function revokeAttestation({ sha256, reason }) {
  const headers = await getAuthHeaders();
  return request(`${API_BASE}/revoke`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sha256, reason }),
  });
}

export async function getCustodyTimeline(sha256) {
  return request(`${API_BASE}/custody/${sha256}`);
}

// ── API Key Management ──

export async function generateApiKey(label) {
  const headers = await getAuthHeaders();
  return request(`${API_BASE}/keys/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ label }),
  });
}

export async function getApiKeys() {
  const headers = await getAuthHeaders();
  return request(`${API_BASE}/keys`, { headers });
}

export async function revokeApiKey(id) {
  const headers = await getAuthHeaders();
  return request(`${API_BASE}/keys/${id}`, {
    method: 'DELETE',
    headers,
  });
}
