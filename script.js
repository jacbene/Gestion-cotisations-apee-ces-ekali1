// script.js (updated)
// Intègre synchronisation avec backend/API, file d'attente offline et notifications online/offline

// ... (tout le code JavaScript précédent reste inchangé) ...

let eleves = [];
let paiements = [];
const cotisationParEleve = 12500;
let parentExistant = null;
let totalRestePrecedent = 0;

const nomsMois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// --- Début: intégration API et gestion offline/online ----
// Utilise window.api (public/api.js) si disponible

function sauvegarderPaiementsLocalCache() {
    localStorage.setItem('apee_paiements', JSON.stringify(paiements));
}

function pushToSyncQueue(item) {
    const queue = JSON.parse(localStorage.getItem('apee_sync_queue') || '[]');
    queue.push(item);
    localStorage.setItem('apee_sync_queue', JSON.stringify(queue));
}

async function processSyncQueue() {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('apee_sync_queue') || '[]');
    if (!queue.length) return;
    for (const item of queue) {
        try {
            if (item.type === 'create_payment') {
                if (window.api) {
                    await window.api.apiFetch('/paiements', { method: 'POST', body: JSON.stringify(item.payload) });
                } else {
                    // unable to sync without API
                    throw new Error('API unavailable');
                }
            }
            // TODO: traiter update/delete si nécessaire
        } catch (err) {
            console.warn('Échec sync item', item, err);
            return; // garder la queue pour prochain essai
        }
    }
    localStorage.removeItem('apee_sync_queue');
    // recharger depuis serveur si possible
    if (window.api && typeof window.api.onSyncComplete === 'function') window.api.onSyncComplete();
}

// Fonction wrapper pour appeler l'API si disponible
async function apiChargerPaiements() {
    if (window.api) {
        const data = await window.api.apiFetch('/paiements');
        return data.map(p => ({
            id: p.id,
            nomParent: p.parent ? p.parent.nom : (p.nomParent || ''),
            telephone: p.parent ? p.parent.telephone : (p.telephone || ''),
            adresse: p.parent ? p.parent.adresse : (p.adresse || ''),
            eleves: Array.isArray(p.eleves) ? p.eleves.map(e => ({ id: e.id, nom: e.nom, classe: e.classe })) : [],
            montantTotal: p.montant_total || p.montantTotal || 0,
            montantVerse: p.montant_verse || p.montantVerse || 0,
            reste: p.reste || 0,
            observations: p.observations || '',
            datePaiement: p.date_paiement || p.datePaiement || ''
        }));
    }
    throw new Error('API non disponible');
}

// Remplace la fonction chargerPaiements() originale
async function chargerPaiements() {
    if (navigator.onLine && window.api) {
        try {
            paiements = await apiChargerPaiements();
            // sauvegarder en cache local
            sauvegarderPaiementsLocalCache();
        } catch (err) {
            console.warn('Erreur chargement serveur, fallback localStorage', err);
            const paiementsSauvegardes = localStorage.getItem('apee_paiements');
            paiements = paiementsSauvegardes ? JSON.parse(paiementsSauvegardes) : [];
        }
    } else {
        const paiementsSauvegardes = localStorage.getItem('apee_paiements');
        paiements = paiementsSauvegardes ? JSON.parse(paiementsSauvegardes) : [];
    }

    // afficher dans UI
    const tbody = document.querySelector('#tableau-paiements tbody');
    if (tbody) tbody.innerHTML = '';
    paiements.forEach(paiement => afficherPaiementDansTableau(paiement));
    afficherDerniersPaiements();
    mettreAJourBudget();
}

// Enregistrement d'un paiement (remplace l'ancienne fonction enregistrerPaiement)
async function enregistrerPaiement() {
    const nomParent = document.getElementById('nom-parent').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const adresse = document.getElementById('adresse').value.trim();
    const montantVerse = parseFloat(document.getElementById('montant-verse').value.trim()) || 0;
    const observations = document.getElementById('observations').value.trim();

    if (!nomParent || !telephone) {
        alert("Veuillez remplir les informations du parent (nom et téléphone).\n");
        return;
    }
    if (!parentExistant && eleves.length === 0) {
        alert("Veuillez ajouter au moins un élève pour un nouveau parent.\n");
        return;
    }

    let montantTotal = 0;
    if (parentExistant && eleves.length === 0) {
        montantTotal = totalRestePrecedent;
    } else {
        montantTotal = eleves.length * cotisationParEleve;
        if (parentExistant) montantTotal += totalRestePrecedent;
    }

    const reste = montantTotal - montantVerse;
    const datePaiement = formaterDate(new Date());

    const paiement = {
        id: Date.now(),
        nomParent,
        telephone,
        adresse,
        eleves: [...eleves],
        montantTotal,
        montantVerse,
        reste,
        observations,
        datePaiement
    };

    if (navigator.onLine && window.api && window.api.getToken && window.api.getToken()) {
        // essayer d'enregistrer sur le serveur
        const payload = {
            parent: { nom: paiement.nomParent, telephone: paiement.telephone, adresse: paiement.adresse },
            eleves: paiement.eleves.map(e => ({ nom: e.nom, classe: e.classe })),
            montantTotal: paiement.montantTotal,
            montantVerse: paiement.montantVerse,
            reste: paiement.reste,
            observations: paiement.observations,
            datePaiement: new Date().toISOString().slice(0,10)
        };
        try {
            const serverResp = await window.api.apiFetch('/paiements', { method: 'POST', body: JSON.stringify(payload) });
            // ajouter la réponse serveur au cache local
            const serverPaiement = {
                id: serverResp.id,
                nomParent: serverResp.parent.nom,
                telephone: serverResp.parent.telephone,
                adresse: serverResp.parent.adresse,
                eleves: (serverResp.eleves || []).map(e => ({ id: e.id, nom: e.nom, classe: e.classe })),
                montantTotal: serverResp.montant_total || serverResp.montantTotal,
                montantVerse: serverResp.montant_verse || serverResp.montantVerse,
                reste: serverResp.reste,
                observations: serverResp.observations,
                datePaiement: serverResp.date_paiement || serverResp.datePaiement
            };
            paiements.push(serverPaiement);
            sauvegarderPaiementsLocalCache();
            afficherPaiementDansTableau(serverPaiement);
            afficherDerniersPaiements();
            mettreAJourBudget();
            alert('Paiement enregistré (serveur).');
        } catch (err) {
            console.warn('Erreur enregistrement serveur, mise en queue', err);
            pushToSyncQueue({ type: 'create_payment', payload: paiement });
            paiements.push(paiement);
            sauvegarderPaiementsLocalCache();
            afficherPaiementDansTableau(paiement);
            alert('Paiement enregistré en local (sera synchronisé plus tard).');
        }
    } else {
        // hors-ligne ou pas de token -> mettre en queue
        pushToSyncQueue({ type: 'create_payment', payload: paiement });
        paiements.push(paiement);
        sauvegarderPaiementsLocalCache();
        afficherPaiementDansTableau(paiement);
        alert('Hors-ligne : paiement stocké localement et mis en file d\'attente.');
    }

    reinitialiserFormulaire();
}

// Mettre à jour indicateur réseau
function updateNetworkStatus() {
    const statusEl = document.getElementById('pwa-status');
    const msg = document.getElementById('pwa-message');
    const installBtn = document.getElementById('install-button');
    if (!statusEl || !msg) return;
    if (navigator.onLine) {
        msg.textContent = 'Connexion réseau : en ligne';
        statusEl.style.display = 'block';
        statusEl.style.backgroundColor = '#e8f5e9';
        if (installBtn) installBtn.style.display = 'inline-block';
        setTimeout(() => statusEl.style.display = 'none', 2500);
        // tenter la synchronisation
        processSyncQueue().catch(err => console.error('Sync queue failed', err));
    } else {
        msg.textContent = 'Mode hors ligne - Les données sont sauvegardées localement';
        statusEl.style.display = 'block';
        statusEl.style.backgroundColor = '#fff3cd';
        if (installBtn) installBtn.style.display = 'none';
    }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
// appeler au chargement
document.addEventListener('DOMContentLoaded', updateNetworkStatus);

// --- Fin intégration API / offline ---

// Le reste du script original (fonctions d'affichage, calculs, import/export, etc.) reste inchangé

// ... (le reste du code JavaScript reste inchangé) ...
