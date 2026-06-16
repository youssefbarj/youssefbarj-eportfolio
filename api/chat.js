// Vercel serverless function — proxies chat messages to Hermes Telegram bot
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8725104568:AAGb2inVAW51faLUf3SPT9FBVrucMJqXU04';
const API = `https://api.telegram.org/bot${TOKEN}`;

// In-memory chat sessions (resets on cold start, fine for demo)
const sessions = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { message, chatId } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    // Use existing chat session or create new one
    const key = chatId || 'demo';
    if (!sessions[key]) {
      sessions[key] = { lastUpdateId: 0, chatId: null };
    }
    const session = sessions[key];

    // Send message to the bot
    const sendResp = await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: session.chatId || 8602386343, // Youssef's Telegram ID as fallback
        text: `[Portfolio] ${message}`,
      }),
    });
    const sendData = await sendResp.json();

    if (!sendData.ok) {
      return res.status(500).json({ error: sendData.description });
    }

    // Store the chat_id for future messages
    session.chatId = sendData.result.chat.id;

    // Wait briefly then poll for the bot's response
    await new Promise(r => setTimeout(r, 3000));

    const pollResp = await fetch(`${API}/getUpdates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offset: session.lastUpdateId > 0 ? session.lastUpdateId + 1 : undefined,
        limit: 5,
        timeout: 5,
      }),
    });
    const pollData = await pollResp.json();

    if (pollData.ok && pollData.result.length > 0) {
      // Get the latest update
      const latest = pollData.result[pollData.result.length - 1];
      session.lastUpdateId = latest.update_id;

      if (latest.message && latest.message.text) {
        return res.json({ reply: latest.message.text, chatId: session.chatId });
      }
    }

    // No response yet — return placeholder
    return res.json({
      reply: "I've received your message. The agent is processing it — try again in a moment or message directly on Telegram.",
      chatId: session.chatId,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
