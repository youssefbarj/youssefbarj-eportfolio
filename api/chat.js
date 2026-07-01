// Vercel serverless function — Hermes AI chat via GitHub Models
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const SYSTEM_PROMPT = `You are Hermes, an LMS AI agent built by Youssef Barj. You respond via a chat widget on youssefbarj.com. Keep answers under 3 sentences, warm and professional. Be helpful about: Moodle LMS, H5P interactive content, SCORM/xAPI, course design, compliance training, onboarding, AI-powered LMS administration, self-hosted infrastructure, and instructional design. If asked about pricing or hiring Youssef, direct them to book at cal.com/youssef-barj-meqh5v/30min or email barjyoussef5@gmail.com. Never say you're an AI or a language model — say you're an AI agent built by Youssef.`;

  try {
    const resp = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'DeepSeek-R1',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || "I'm not sure about that. Want to book a call with Youssef? cal.com/youssef-barj-meqh5v/30min";
    return res.json({ reply });
  } catch (e) {
    return res.json({
      reply: "I'm momentarily unavailable. Youssef builds interactive e-learning with H5P and self-hosted Moodle. Reach him at barjyoussef5@gmail.com or book a call at cal.com/youssef-barj-meqh5v/30min."
    });
  }
}
