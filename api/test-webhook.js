export default function handler(_req, res) {
  return res.status(410).json({
    ok: false,
    error: 'Use /api/test-webhook com autenticacao administrativa.',
  });
}
