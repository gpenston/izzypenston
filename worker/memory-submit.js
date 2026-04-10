/**
 * Cloudflare Worker — Memory Submission + Admin API
 *
 * Handles:
 *   POST /api/submit        — public form submission → creates GitHub Issue
 *   GET  /api/admin/pending  — PIN-protected → lists pending memory issues
 *   POST /api/admin/approve/:id — PIN-protected → adds "approved" label
 *   POST /api/admin/reject/:id  — PIN-protected → adds "rejected" label + closes
 *   POST /api/admin/unpublish   — PIN-protected → removes a published memory
 *
 * Secrets (set in Cloudflare dashboard):
 *   GITHUB_TOKEN  — fine-grained PAT with Issues write on gpenston/izzypenston
 *   ADMIN_PIN     — shared PIN for the admin page (e.g. "8472")
 */

const REPO_OWNER = 'gpenston';
const REPO_NAME = 'izzypenston';
const GITHUB_API = 'https://api.github.com';

// --- Helpers ---

const ALLOWED_ORIGIN = 'https://izzypenston.com';

function getCorsOrigin(request) {
  const origin = request ? request.headers.get('Origin') : null;
  return origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN;
}

function json(data, status = 200, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getCorsOrigin(request) }
  });
}

function corsHeaders(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getCorsOrigin(request),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin'
    }
  });
}

// Timing-safe string comparison to prevent timing attacks on PIN
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.length !== bBuf.length) {
    // Pad shorter to match length, then compare (constant-time regardless)
    const dummy = encoder.encode(a.padEnd(b.length, '\0'));
    let result = 0;
    for (let i = 0; i < dummy.length; i++) result |= dummy[i] ^ bBuf[i];
    return false;
  }
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
  return result === 0;
}

async function githubFetch(path, env, options = {}) {
  const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'izzypenston-worker',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return res;
}

// --- Helpers ---
// --- Helpers ---

// Upload a photo to assets/submissions/ and return the raw GitHub URL
async function commitPhoto(arrayBuffer, index, name, env) {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${rand}-${index + 1}.jpg`;
  const path = `assets/submissions/${filename}`;

  // Convert ArrayBuffer to base64 using chunks to avoid O(n²) string concat
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 8192;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
  }
  const base64 = btoa(binary);

  const res = await githubFetch(`/contents/${path}`, env, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Add photo from ${name.replace(/[^\w\s'-]/g, '').slice(0, 50)}`,
      content: base64
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Photo commit error:', err);
    return null;
  }

  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}`;
}

// --- Input validation ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO_BYTES = 1024 * 1024; // 1 MB

// JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: RIFF....WEBP
function hasValidImageHeader(buf) {
  const b = new Uint8Array(buf.slice(0, 12));
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return true;
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return true;
  return false;
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  // Strip control characters (keep newlines/tabs for message field)
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// --- Spam detection ---

function isSpam({ name, relation, message, website }) {
  // Honeypot: real users never fill this field
  if (website) return true;

  const allText = [name, relation, message].filter(Boolean).join(' ');

  // Block any URLs in submission text — real memories almost never contain links
  if (/https?:\/\/|www\./i.test(allText)) return true;

  // Block known spam keyword patterns
  const spamPatterns = [
    /\bseo\b/i,
    /\b1st page\b/i,
    /first page of google/i,
    /search engine optim/i,
    /\bbacklink/i,
    /price list/i,
    /seo packages?/i,
    /google ranking/i,
    /place your (website|site)/i,
    /make money/i,
    /earn money/i,
    /\bcasino\b/i,
    /\bcrypto\b.*(invest|profit|earn)/i,
  ];

  return spamPatterns.some(p => p.test(allText));
}

// --- Handlers ---

async function handleSubmit(request, env) {
  let name, email, relation, message, website;
  let photoFiles = []; // Array of { arrayBuffer, type }

  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    name = body.name;
    email = body.email;
    relation = body.relation;
    message = body.message;
    website = body.website;
  } else {
    const form = await request.formData();
    name = form.get('name');
    email = form.get('email');
    relation = form.get('relation');
    message = form.get('message');
    website = form.get('website');

    // Collect up to 3 photos
    for (let i = 0; i < 3; i++) {
      const file = form.get('photo_' + i);
      if (file && file instanceof File) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (validTypes.includes(file.type)) {
          const buf = await file.arrayBuffer();
          if (buf.byteLength > MAX_PHOTO_BYTES) continue;
          if (!hasValidImageHeader(buf)) continue;
          photoFiles.push({ arrayBuffer: buf, type: file.type });
        }
      }
    }
  }

  // Sanitize all text inputs
  name = sanitizeString(name);
  email = sanitizeString(email);
  relation = sanitizeString(relation);
  message = sanitizeString(message);

  // Spam check — silently succeed so bots don't retry with different content
  if (isSpam({ name, relation, message, website })) {
    return json({ ok: true });
  }

  // Validate required fields
  if (!name || !email || !message) {
    return json({ ok: false, error: 'Name, email, and message are required.' }, 400);
  }

  // Validate email format
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Please provide a valid email address.' }, 400);
  }

  // Enforce field length limits
  if (name.length > 100 || (relation && relation.length > 100) || email.length > 254 || message.length > 2000) {
    return json({ ok: false, error: 'One or more fields exceed the maximum length.' }, 400);
  }

  // Commit photos sequentially — GitHub Contents API rejects concurrent writes to the same repo
  const photoUrls = [];
  for (let i = 0; i < photoFiles.length; i++) {
    try {
      const url = await commitPhoto(photoFiles[i].arrayBuffer, i, name, env);
      if (url) photoUrls.push(url);
    } catch (err) {
      console.error('Photo upload error:', err);
      // Non-fatal — continue with remaining photos
    }
  }

  // Build issue body
  const now = new Date().toISOString();
  let body = `**Name:** ${name}\n`;
  if (relation) {
    body += `**Relation:** ${relation}\n`;
  }
  body += `\n${message}\n\n---\n_Submitted: ${now}_\n_Email: ${email}_`;

  // Append photo image references after the separator
  if (photoUrls.length > 0) {
    body += '\n\n';
    photoUrls.forEach((url, i) => {
      body += `![Photo ${i + 1}](${url})\n`;
    });
  }

  // Create GitHub Issue
  const res = await githubFetch('/issues', env, {
    method: 'POST',
    body: JSON.stringify({
      title: `Memory from ${name}`,
      body: body,
      labels: ['memory', 'pending'],
      assignees: ['gpenston']
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('GitHub API error:', err);
    return json({ ok: false, error: 'Failed to submit. Please try again.' }, 500);
  }

  return json({ ok: true });
}

async function handleAdminPending(env) {
  const res = await githubFetch('/issues?labels=memory,pending&state=open&per_page=100&sort=created&direction=desc', env);
  if (!res.ok) {
    return json({ ok: false, error: 'Failed to fetch issues' }, 500);
  }

  const issues = await res.json();
  const memories = issues.map(issue => {
    const body = issue.body || '';
    const nameMatch = body.match(/\*\*Name:\*\*\s*(.+)/);
    const relationMatch = body.match(/\*\*Relation:\*\*\s*(.+)/);

    // Extract memory text (between metadata and ---)
    const lines = body.split('\n');
    let memoryLines = [];
    let inMemory = false;
    for (const line of lines) {
      if (line.startsWith('---')) break;
      if (inMemory) memoryLines.push(line);
      if (line.startsWith('**Relation:**') || (!relationMatch && line.startsWith('**Name:**'))) {
        inMemory = true;
      }
    }

    // Extract photo URLs
    const photoUrls = [];
    const photoRegex = /!\[Photo \d+\]\((https:\/\/raw\.githubusercontent\.com\/[^)]+)\)/g;
    let photoMatch;
    while ((photoMatch = photoRegex.exec(body)) !== null) {
      photoUrls.push(photoMatch[1]);
    }

    return {
      id: issue.number,
      name: nameMatch ? nameMatch[1].trim() : 'Unknown',
      relation: relationMatch ? relationMatch[1].trim() : '',
      text: memoryLines.join('\n').trim(),
      photos: photoUrls,
      date: issue.created_at
    };
  });

  return json({ ok: true, memories });
}

async function handleAdminApprove(issueNumber, env) {
  const res = await githubFetch(`/issues/${issueNumber}/labels`, env, {
    method: 'POST',
    body: JSON.stringify({ labels: ['approved'] })
  });

  if (!res.ok) {
    return json({ ok: false, error: 'Failed to approve' }, 500);
  }
  return json({ ok: true });
}

async function handleAdminArchived(env) {
  const res = await githubFetch('/issues?labels=memory,rejected&state=closed&per_page=100&sort=created&direction=desc', env);
  if (!res.ok) {
    return json({ ok: false, error: 'Failed to fetch archived issues' }, 500);
  }

  const issues = await res.json();
  const memories = issues.map(issue => {
    const body = issue.body || '';
    const nameMatch = body.match(/\*\*Name:\*\*\s*(.+)/);
    const relationMatch = body.match(/\*\*Relation:\*\*\s*(.+)/);

    const lines = body.split('\n');
    let memoryLines = [];
    let inMemory = false;
    for (const line of lines) {
      if (line.startsWith('---')) break;
      if (inMemory) memoryLines.push(line);
      if (line.startsWith('**Relation:**') || (!relationMatch && line.startsWith('**Name:**'))) {
        inMemory = true;
      }
    }

    const photoUrls = [];
    const photoRegex = /!\[Photo \d+\]\((https:\/\/raw\.githubusercontent\.com\/[^)]+)\)/g;
    let photoMatch;
    while ((photoMatch = photoRegex.exec(body)) !== null) {
      photoUrls.push(photoMatch[1]);
    }

    return {
      id: issue.number,
      name: nameMatch ? nameMatch[1].trim() : 'Unknown',
      relation: relationMatch ? relationMatch[1].trim() : '',
      text: memoryLines.join('\n').trim(),
      photos: photoUrls,
      date: issue.created_at
    };
  });

  return json({ ok: true, memories });
}

async function handleAdminRestore(issueNumber, env) {
  // Reopen the issue
  const reopenRes = await githubFetch(`/issues/${issueNumber}`, env, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'open' })
  });

  if (!reopenRes.ok) {
    return json({ ok: false, error: 'Failed to reopen issue' }, 500);
  }

  // Remove rejected label
  await githubFetch(`/issues/${issueNumber}/labels/rejected`, env, {
    method: 'DELETE'
  });

  // Add approved label (triggers the publish workflow)
  const labelRes = await githubFetch(`/issues/${issueNumber}/labels`, env, {
    method: 'POST',
    body: JSON.stringify({ labels: ['approved'] })
  });

  if (!labelRes.ok) {
    return json({ ok: false, error: 'Failed to approve' }, 500);
  }

  return json({ ok: true });
}

async function handleAdminReject(issueNumber, env) {
  // Add rejected label
  await githubFetch(`/issues/${issueNumber}/labels`, env, {
    method: 'POST',
    body: JSON.stringify({ labels: ['rejected'] })
  });

  // Close the issue
  await githubFetch(`/issues/${issueNumber}`, env, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed' })
  });

  return json({ ok: true });
}

async function handleAdminCaptions(request, env) {
  const { manifest } = await request.json();
  if (!manifest || !Array.isArray(manifest)) {
    return json({ ok: false, error: 'manifest array is required' }, 400);
  }

  // Fetch current manifest.json to get its SHA
  const fileRes = await githubFetch('/contents/assets/photos/manifest.json', env);
  if (!fileRes.ok) {
    return json({ ok: false, error: 'Failed to fetch manifest.json' }, 500);
  }

  const fileData = await fileRes.json();
  const updated = JSON.stringify(manifest, null, 2) + '\n';

  const putRes = await githubFetch('/contents/assets/photos/manifest.json', env, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'Update gallery captions via admin',
      content: btoa(unescape(encodeURIComponent(updated))),
      sha: fileData.sha
    })
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    console.error('GitHub PUT error:', err);
    return json({ ok: false, error: 'Failed to update manifest.json' }, 500);
  }

  return json({ ok: true });
}

async function handleAdminUnpublish(request, env) {
  const { name, text } = await request.json();
  if (!name || !text) {
    return json({ ok: false, error: 'name and text are required' }, 400);
  }

  // Fetch current memories.json from the repo
  const fileRes = await githubFetch('/contents/assets/memories.json', env);
  if (!fileRes.ok) {
    return json({ ok: false, error: 'Failed to fetch memories.json' }, 500);
  }

  const fileData = await fileRes.json();
  const bytes = Uint8Array.from(atob(fileData.content.replace(/\n/g, '')), c => c.charCodeAt(0));
  const content = new TextDecoder().decode(bytes);
  const memories = JSON.parse(content);

  // Find and remove the matching memory
  const idx = memories.findIndex(m => m.name === name && m.text === text);
  if (idx === -1) {
    return json({ ok: false, error: 'Memory not found' }, 404);
  }

  memories.splice(idx, 1);

  // Commit updated file via GitHub Contents API
  const updated = JSON.stringify(memories, null, 2) + '\n';
  const putRes = await githubFetch('/contents/assets/memories.json', env, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Remove memory from ${name}`,
      content: btoa(unescape(encodeURIComponent(updated))),
      sha: fileData.sha
    })
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    console.error('GitHub PUT error:', err);
    return json({ ok: false, error: 'Failed to update memories.json' }, 500);
  }

  return json({ ok: true });
}

// --- Router ---

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsHeaders(request);
    }

    // Public: form submission
    if (path === '/api/submit' && request.method === 'POST') {
      return handleSubmit(request, env);
    }

    // Admin routes — require PIN
    if (path.startsWith('/api/admin/')) {
      const pin = request.headers.get('X-Admin-Pin');
      if (!pin || !timingSafeEqual(pin, env.ADMIN_PIN)) {
        return json({ ok: false, error: 'Unauthorized' }, 401, request);
      }

      if (path === '/api/admin/pending' && request.method === 'GET') {
        return handleAdminPending(env);
      }

      if (path === '/api/admin/archived' && request.method === 'GET') {
        return handleAdminArchived(env);
      }

      const restoreMatch = path.match(/^\/api\/admin\/restore\/(\d+)$/);
      if (restoreMatch && request.method === 'POST') {
        return handleAdminRestore(restoreMatch[1], env);
      }

      const approveMatch = path.match(/^\/api\/admin\/approve\/(\d+)$/);
      if (approveMatch && request.method === 'POST') {
        return handleAdminApprove(approveMatch[1], env);
      }

      const rejectMatch = path.match(/^\/api\/admin\/reject\/(\d+)$/);
      if (rejectMatch && request.method === 'POST') {
        return handleAdminReject(rejectMatch[1], env);
      }

      if (path === '/api/admin/unpublish' && request.method === 'POST') {
        return handleAdminUnpublish(request, env);
      }

      if (path === '/api/admin/captions' && request.method === 'POST') {
        return handleAdminCaptions(request, env);
      }
    }

    return json({ error: 'Not found' }, 404, request);
  }
};
