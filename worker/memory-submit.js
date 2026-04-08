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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

function corsHeaders() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin'
    }
  });
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

async function sendNotification(env, { name, relation, message, email }) {
  if (!env.RESEND_API_KEY) return;
  const subject = `New memory from ${name}`;
  const relationLine = relation ? `<p><strong>Relation:</strong> ${relation}</p>` : '';
  const html = `
    <h2>New memory submitted on izzypenston.com</h2>
    <p><strong>Name:</strong> ${name}</p>
    ${relationLine}
    <p><strong>Email:</strong> ${email}</p>
    <blockquote style="border-left:3px solid #B34D18;margin:16px 0;padding:0 16px;color:#555;">${message.replace(/\n/g, '<br>')}</blockquote>
    <p><a href="https://izzypenston.com/admin">Review in admin</a></p>
  `.trim();
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'memories@izzypenston.com',
      to: ['gpenston@me.com', 'zozomay@gmail.com'],
      subject,
      html
    })
  });
}

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
      message: `Add photo from ${name}`,
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
          photoFiles.push({ arrayBuffer: buf, type: file.type });
        }
      }
    }
  }

  // Spam check — silently succeed so bots don't retry with different content
  if (isSpam({ name, relation, message, website })) {
    return json({ ok: true });
  }

  // Validate required fields
  if (!name || !email || !message) {
    return json({ ok: false, error: 'Name, email, and message are required.' }, 400);
  }

  // Commit photos first (in parallel) — failures are non-fatal
  const photoUrls = [];
  if (photoFiles.length > 0) {
    try {
      const results = await Promise.all(
        photoFiles.map((f, i) => commitPhoto(f.arrayBuffer, i, name, env))
      );
      results.forEach(url => { if (url) photoUrls.push(url); });
    } catch (err) {
      console.error('Photo upload error:', err);
      // Continue — submit the memory without photos
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
      labels: ['memory', 'pending']
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('GitHub API error:', err);
    return json({ ok: false, error: 'Failed to submit. Please try again.' }, 500);
  }

  // Fire-and-forget notification — don't block the response
  sendNotification(env, { name, relation, message, email }).catch(err => {
    console.error('Resend error:', err);
  });

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
      return corsHeaders();
    }

    // Public: form submission
    if (path === '/api/submit' && request.method === 'POST') {
      return handleSubmit(request, env);
    }

    // Admin routes — require PIN
    if (path.startsWith('/api/admin/')) {
      const pin = request.headers.get('X-Admin-Pin');
      if (!pin || pin !== env.ADMIN_PIN) {
        return json({ ok: false, error: 'Unauthorized' }, 401);
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

    return json({ error: 'Not found' }, 404);
  }
};
