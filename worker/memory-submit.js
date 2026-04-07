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

// --- Handlers ---

async function handleSubmit(request, env) {
  let name, email, relation, message, gotcha;

  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    name = body.name;
    email = body.email;
    relation = body.relation;
    message = body.message;
    gotcha = body._gotcha;
  } else {
    const form = await request.formData();
    name = form.get('name');
    email = form.get('email');
    relation = form.get('relation');
    message = form.get('message');
    gotcha = form.get('_gotcha');
  }

  // Honeypot check — silently succeed for bots
  if (gotcha) {
    return json({ ok: true });
  }

  // Validate required fields
  if (!name || !email || !message) {
    return json({ ok: false, error: 'Name, email, and message are required.' }, 400);
  }

  // Build issue body
  const now = new Date().toISOString();
  let body = `**Name:** ${name}\n`;
  if (relation) {
    body += `**Relation:** ${relation}\n`;
  }
  body += `\n${message}\n\n---\n_Submitted: ${now}_\n_Email: ${email}_`;

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

    return {
      id: issue.number,
      name: nameMatch ? nameMatch[1].trim() : 'Unknown',
      relation: relationMatch ? relationMatch[1].trim() : '',
      text: memoryLines.join('\n').trim(),
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
  const content = atob(fileData.content.replace(/\n/g, ''));
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
    }

    return json({ error: 'Not found' }, 404);
  }
};
