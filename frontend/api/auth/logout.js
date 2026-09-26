/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   POST /api/auth/logout

   Supprime le cookie de session. Nécessaire car un cookie
   httpOnly ne peut PAS être effacé par du JavaScript côté
   navigateur — seule une réponse serveur avec Set-Cookie et
   Max-Age=0 peut le faire.
   ═══════════════════════════════════════════════════════════ */

const { clearAuthCookie } = require('../_shared');

module.exports = async function logout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
};
