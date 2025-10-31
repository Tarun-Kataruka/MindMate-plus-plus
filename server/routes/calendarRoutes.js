import express from 'express';

const router = express.Router();

router.get('/callback', (req, res) => {
  const { code, state, scope, error } = req.query || {};
  const clientBase = process.env.CLIENT_APP_URL || 'http://localhost:8081';
  const url = new URL('/google-callback', clientBase);
  if (code) url.searchParams.set('code', String(code));
  if (state) url.searchParams.set('state', String(state));
  if (scope) url.searchParams.set('scope', String(scope));
  if (error) url.searchParams.set('error', String(error));
  return res.redirect(url.toString());
});

export default router;


