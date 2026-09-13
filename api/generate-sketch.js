// Serverless-функция Vercel: /api/generate-sketch
// Принимает POST { prompt, count } с фронтенда и генерирует изображения
// через Pollinations. Ключ хранится только в переменных окружения Vercel.
// Возвращает { images: ["data:image/png;base64,...", ...] }.

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    response.status(500).json({
      error: 'POLLINATIONS_API_KEY не настроен в переменных окружения Vercel.'
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
    // В актуальном Pollinations API для FLUX.2 Klein используется alias "klein".
    // Делаем отдельный запрос для каждой картинки, сохраняя прежний count.
    const requests = Array.from({ length: count }, async () => {
      const url =
        'https://gen.pollinations.ai/image/' +
        encodeURIComponent(fullPrompt) +
        '?model=klein&width=1024&height=1024&nologo=true';

      const aiResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + apiKey
        }
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        let message = 'Pollinations не смог сгенерировать изображение.';
        try {
          const errorData = JSON.parse(errorText);
          message =
            (errorData && errorData.error && errorData.error.message) ||
            errorData.message ||
            message;
        } catch (e) {
          if (errorText) message = errorText.slice(0, 500);
        }
        throw new Error('Pollinations ' + aiResponse.status + ': ' + message);
      }

      const buffer = Buffer.from(await aiResponse.arrayBuffer());
      return 'data:image/png;base64,' + buffer.toString('base64');
    });

    const images = await Promise.all(requests);
    response.status(200).json({ images });
  } catch (err) {
    console.error('Pollinations error', err);
    response.status(500).json({
      error: 'Ошибка генерации: ' +
        (err && err.message ? err.message : String(err))
    });
  }
}
