# Intégration backend (SQLite + Express)

1) Arborescence suggérée :
   - backend/
     - init.sql
     - server.js
     - package.json
     - .gitignore
   - public/
     - index.html (existant)
     - script.js (existant)
     - api.js (nouveau)
     - style.css, icons, manifest.json, sw.js (existant)

2) Installation & exécution (développement local) :
   - cd backend
   - npm install
   - npm start
   - Ouvrir http://localhost:3000/ (le serveur sert le dossier public si présent)

3) Points importants :
   - Le backend crée `apee.db` automatiquement. Ajoutez `apee.db` à .gitignore.
   - En production : protégez les endpoints (auth), configurez CORS de façon restrictive, utilisez HTTPS.
   - Pour l’envoi de SMS réel, ajouter une intégration côté serveur (Twilio, Africa's Talking, etc.).

4) Front :
   - Ajouter `<script src="api.js"></script>` dans `index.html` avant `script.js`.
   - Le fichier `api.js` expose `window.api` et s’occupe de la queue de synchronisation offline.
   - Adapter `script.js` pour appeler l’API si `navigator.onLine`, ou mettre en queue quand hors-ligne (exemples fournis).
