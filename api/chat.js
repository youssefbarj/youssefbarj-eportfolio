// Vercel serverless function — proxies chat to Hermes bridge
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const resp = await fetch('http://167.71.66.198:8888', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, origin: 'portfolio' }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await resp.json();
    return res.json(data);
  } catch (e) {
    return res.json({
      reply: "I'm momentarily unavailable. Youssef builds interactive e-learning with H5P and self-hosted Moodle. Reach him at barjyoussef5@gmail.com or book a call at cal.com/youssef-barj-meqh5v/30min."
    });
  }
}
