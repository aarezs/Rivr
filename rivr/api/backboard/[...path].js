export default async function handler(req, res) {
  // Allow CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Strip /api/backboard prefix and any query string to get the clean path
  const urlPath = req.url.split('?')[0];
  const backboardPath = urlPath.replace(/^\/api\/backboard/, '');

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing X-API-Key header' });
  }

  try {
    const targetUrl = `https://app.backboard.io/api${backboardPath}`;
    console.log('[Backboard Proxy]', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[Backboard Proxy] Error:', err);
    res.status(502).json({ error: 'Failed to reach Backboard API', detail: err.message });
  }
}
