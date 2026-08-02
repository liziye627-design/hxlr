import { Router } from 'express';

const router = Router();

type ProviderMode = 'browser' | 'unspeech' | 'openai-compatible';

function getProviderConfig() {
  const provider = (process.env.TTS_PROVIDER || 'browser') as ProviderMode;
  const endpoint =
    process.env.TTS_PROVIDER_ENDPOINT ||
    process.env.UNSPEECH_ENDPOINT ||
    process.env.OPENAI_COMPATIBLE_TTS_ENDPOINT ||
    '';

  return {
    provider,
    endpoint,
    model: process.env.TTS_MODEL || 'tts-1',
    voice: process.env.TTS_VOICE || 'alloy',
    responseFormat: process.env.TTS_RESPONSE_FORMAT || 'mp3',
    speed: Number(process.env.TTS_SPEED || '1'),
    apiKey: process.env.TTS_PROVIDER_API_KEY || process.env.OPENAI_API_KEY || '',
  };
}

router.get('/status', (_req, res) => {
  const config = getProviderConfig();
  const enabled = config.provider !== 'browser' && Boolean(config.endpoint);

  res.json({
    enabled,
    provider: config.provider,
    endpoint: config.endpoint || null,
    model: config.model,
    fallback: 'browser',
  });
});

router.post('/speak', async (req, res) => {
  const config = getProviderConfig();

  if (config.provider === 'browser' || !config.endpoint) {
    return res.status(204).end();
  }

  const text = String(req.body?.text || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'text_required' });
  }

  const voice = String(req.body?.voiceStyle || req.body?.voice || config.voice || 'alloy');
  const model = String(req.body?.model || config.model || 'tts-1');
  const responseFormat = String(req.body?.responseFormat || config.responseFormat || 'mp3');
  const speed = Number(req.body?.speed || config.speed || 1);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  try {
    const upstream = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: responseFormat,
        speed,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      return res.status(upstream.status).json({
        error: 'tts_upstream_failed',
        details: errorText || upstream.statusText,
      });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_tts_error';
    return res.status(502).json({
      error: 'tts_request_failed',
      details: message,
    });
  }
});

export default router;
