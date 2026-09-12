/* ═══════════════════════════════════════
   CONFIG FRONTEND — HumanitAID
   ═══════════════════════════════════════
   Fichier statique éditable au moment du déploiement.
   Charger AVANT api.js (<script src="js/config.js">).

   API_BASE : URL d'origine de l'API.
   Laisser '' (vide) : le frontend et les fonctions serverless
   (Vercel) partagent le même domaine → requêtes same-origin.
   Seule exception : une prévisualisation locale avec une API
   externe, où renseigner l'origine complète.
   ═══════════════════════════════════════ */

window.HUMANITAID_CONFIG = window.HUMANITAID_CONFIG || {};

window.HUMANITAID_CONFIG.API_BASE = '';
