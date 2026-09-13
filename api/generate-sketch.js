// Serverless-функция Vercel: /api/generate-sketch
// Принимает POST { prompt, count } с фронтенда, дергает OpenAI Images API
// с ключом из переменной окружения (ключ никогда не попадает в браузер).
// Возвращает { images: ["data:image/png;base64,...", ...] }.

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(500).json({
      error: 'OPENAI_API_KEY не настроен в переменных окружения Vercel.'
    });
    return;
  }

  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  const prompt = String(body.prompt || '').trim();
  const count = Math.min(Math.max(parseInt(body.count, 10) || 2, 1), 4);

  if (!prompt) {
    response.status(400).json({ error: 'Пустой запрос (prompt).' });
    return;
  }

  const fullPrompt =
    'Реалистичная фотография изделия для портфолио сварочной мастерской, ровный свет, без текста и логотипов. ' +
    prompt;

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        n: count,
        size: '1024x1024'
      })
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      const message = (data && data.error && data.error.message) || 'Запрос к OpenAI не удался.';
      response.status(aiResponse.status).json({ error: message });
      return;
    }

    const images = (data.data || [])
      .map((item) => (item.b64_json ? 'data:image/png;base64,' + item.b64_json : item.url))
      .filter(Boolean);

    response.status(200).json({ images });
  } catch (err) {
    response.status(500).json({ error: 'Ошибка генерации: ' + (err && err.message ? err.message : String(err)) });
  }
}
