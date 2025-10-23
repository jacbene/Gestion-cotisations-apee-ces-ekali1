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
// --- Extrait: intégration API dans script.js ---

// Assurez-vous que api.js est chargé (window.api)
async function chargerPaiements() {
  if (window.api) {
    try {
      // si online -> charger depuis serveur (si token présent)
      if (navigator.onLine) {
        const data = await window.api.apiFetch('/paiements');
        paiements = data.map(p => ({
          id: p.id,
          nomParent: p.parent ? p.parent.nom : '',
          telephone: p.parent ? p.parent.telephone : '',
          adresse: p.parent ? p.parent.adresse : '',
          eleves: (p.eleves || []).map(e => ({ id: e.id, nom: e.nom, classe: e.classe })),
          montantTotal: p.montant_total || p.montantTotal || 0,
          montantVerse: p.montant_verse || p.montantVerse || 0,
          reste: p.reste || 0,
          observations: p.observations || '',
          datePaiement: p.date_paiement || p.datePaiement || ''
        }));
        localStorage.setItem('apee_paiements', JSON.stringify(paiements));
      } else {
        const saved = localStorage.getItem('apee_paiements');
        paiements = saved ? JSON.parse(saved) : [];
      }
    } catch (err) {
      console.warn('Erreur chargement API, fallback local', err);
      const saved = localStorage.getItem('apee_paiements');
      paiements = saved ? JSON.parse(saved) : [];
    }
  } else {
    // fallback: comportement existant (local)
    const saved = localStorage.getItem('apee_paiements');
    paiements = saved ? JSON.parse(saved) : [];
  }

  const tbody = document.querySelector('#tableau-paiements tbody');
  tbody.innerHTML = '';
  paiements.forEach(p => afficherPaiementDansTableau(p));
  afficherDerniersPaiements();
  mettreAJourBudget();
}

// Remplacer/envelopper l'enregistrement de paiement
async function enregistrerPaiement() {
  // validation existante...
  // construire objet paiement (comme dans l'ancien code)
  const paiement = {
    // ... mêmes champs que dans le code original ...
    nomParent: document.getElementById('nom-parent').value.trim(),
    telephone: document.getElementById('telephone').value.trim(),
    adresse: document.getElementById('adresse').value.trim(),
    eleves: [...eleves],
    montantTotal: (function() { return parseInt((document.getElementById('montant-total').value || '0').replace(/\D/g,'')) || (eleves.length * 12500); })(),
    montantVerse: parseFloat(document.getElementById('montant-verse').value.trim()) || 0,
    reste: 0,
    observations: document.getElementById('observations').value.trim(),
    datePaiement: (new Date()).toLocaleDateString('fr-FR')
  };
  paiement.reste = paiement.montantTotal - paiement.montantVerse;

  if (navigator.onLine && window.api) {
    try {
      // utilise token via apiFetch (window.api.apiFetch)
      const payload = {
        parent: { nom: paiement.nomParent, telephone: paiement.telephone, adresse: paiement.adresse },
        eleves: paiement.eleves.map(e => ({ nom: e.nom, classe: e.classe })),
        montantTotal: paiement.montantTotal,
        montantVerse: paiement.montantVerse,
        reste: paiement.reste,
        observations: paiement.observations,
        datePaiement: new Date().toISOString().slice(0,10)
      };
      const serverResp = await window.api.apiFetch('/paiements', { method: 'POST', body: JSON.stringify(payload) });
      // ajouter en local et update UI
      paiements.push({
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
      });
      localStorage.setItem('apee_paiements', JSON.stringify(paiements));
      afficherPaiementDansTableau(paiements[paiements.length - 1]);
      afficherDerniersPaiements();
      mettreAJourBudget();
      alert('Paiement enregistré sur le serveur.');
    } catch (err) {
      console.warn('Enregistrement serveur échoué, mise en queue', err);
      window.api.pushToSyncQueue({ type: 'create_payment', payload: paiement });
      paiement.id = Date.now();
      paiements.push(paiement);
      localStorage.setItem('apee_paiements', JSON.stringify(paiements));
      afficherPaiementDansTableau(paiement);
      alert('Hors-ligne : paiement enregistré localement et mis en file d\'attente.');
    }
  } else {
    // offline
    if (window.api) window.api.pushToSyncQueue({ type: 'create_payment', payload: paiement });
    paiement.id = Date.now();
    paiements.push(paiement);
    localStorage.setItem('apee_paiements', JSON.stringify(paiements));
    afficherPaiementDansTableau(paiement);
    alert('Hors-ligne : paiement enregistré localement et mis en file d\'attente.');
  }
  reinitialiserFormulaire();
}

// Réseaux: notifier online/offline (utilise l'élément #pwa-status)
function updateNetworkStatus() {
  const statusEl = document.getElementById('pwa-status');
  const msg = document.getElementById('pwa-message');
  if (!statusEl || !msg) return;
  if (navigator.onLine) {
    msg.textContent = 'Connexion réseau : en ligne';
    statusEl.style.display = 'block';
    statusEl.style.backgroundColor = '#e8f5e9';
    setTimeout(() => statusEl.style.display = 'none', 2500);
  } else {
    msg.textContent = 'Mode hors ligne - Les données sont sauvegardées localement';
    statusEl.style.display = 'block';
    statusEl.style.backgroundColor = '#fff3cd';
  }
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
document.addEventListener('DOMContentLoaded', updateNetworkStatus);
// Ajout des fonctionnalités PWA au début du fichier
document.addEventListener('DOMContentLoaded', function() {
    // Vérification de la connexion
    window.addEventListener('online', function() {
        document.getElementById('pwa-message').textContent = 'Connexion rétablie';
        document.getElementById('pwa-status').style.display = 'block';
        document.getElementById('pwa-status').style.backgroundColor = '#e8f5e9';
        
        setTimeout(() => {
            document.getElementById('pwa-status').style.display = 'none';
        }, 3000);
    });
    
    window.addEventListener('offline', function() {
        document.getElementById('pwa-message').textContent = 'Mode hors ligne - Les données sont sauvegardées localement';
        document.getElementById('pwa-status').style.display = 'block';
        document.getElementById('pwa-status').style.backgroundColor = '#fff3cd';
    });
    
    // Vérifier l'état de la connexion au chargement
    if (!navigator.onLine) {
        document.getElementById('pwa-message').textContent = 'Mode hors ligne - Les données sont sauvegardées localement';
        document.getElementById('pwa-status').style.display = 'block';
        document.getElementById('pwa-status').style.backgroundColor = '#fff3cd';
    }
    
    // Le reste de l'initialisation existante...
    chargerPaiements();

    // Initialisation des dates
    const aujourdhui = new Date();
    document.getElementById('date-debut').valueAsDate = aujourdhui;

    let finSemaine = new Date();
    finSemaine.setDate(aujourdhui.getDate() + 6);
    document.getElementById('date-fin').valueAsDate = finSemaine;

    // Mettre à jour l'affichage du budget
    mettreAJourBudget();

    // Afficher les derniers paiements
    afficherDerniersPaiements();

    // Prevent scrollwheel on montant-verse
    document.getElementById('montant-verse').addEventListener('wheel', function(e) {
        this.blur();
    });
});

// ... (le reste du code JavaScript reste inchangé) ...

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
    if (tabId === 'budget') mettreAJourBudget();
}

function mettreAJourBudget() {
    const totalCotisations = paiements.reduce((total, paiement) => total + paiement.montantVerse, 0);
    const objectifRecettes = 100 * cotisationParEleve;
    const tauxRealisation = objectifRecettes > 0 ? (totalCotisations / objectifRecettes) * 100 : 0;
    document.getElementById('objectif-recettes').textContent = objectifRecettes.toLocaleString('fr-FR') + ' FCFA';
    document.getElementById('recettes-realisees').textContent = totalCotisations.toLocaleString('fr-FR') + ' FCFA';
    document.getElementById('taux-realisation').textContent = tauxRealisation.toFixed(1) + '%';
    document.getElementById('progress-bar-fill').style.width = Math.min(tauxRealisation, 100) + '%';
    document.getElementById('progress-text').textContent = Math.min(tauxRealisation, 100).toFixed(1) + '%';
    mettreAJourDetailsMensuels();
}

// Fonction pour mettre à jour les détails mensuels des cotisations
function parseDateFr(dateStr) {
    // Format jj/mm/aaaa
    if (dateStr.includes('/')) {
        const [jour, mois, annee] = dateStr.split('/').map(Number);
        if (jour && mois && annee) {
            return new Date(annee, mois - 1, jour);
        }
    }
    // Fallback à Date.parse
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? new Date() : new Date(parsed);
}

function mettreAJourDetailsMensuels() {
    const detailsMensuels = document.getElementById('details-mensuels');
    detailsMensuels.innerHTML = '';
    const paiementsParMois = {};
    paiements.forEach(paiement => {
        let datePaiement = parseDateFr(paiement.datePaiement);
        const moisAnnee = `${nomsMois[datePaiement.getMonth()]} ${datePaiement.getFullYear()}`;
        if (!paiementsParMois[moisAnnee]) {
            paiementsParMois[moisAnnee] = { montantTotal: 0, nombrePaiements: 0, nombreEleves: 0 };
        }
        paiementsParMois[moisAnnee].montantTotal += paiement.montantVerse;
        paiementsParMois[moisAnnee].nombrePaiements += 1;
        paiementsParMois[moisAnnee].nombreEleves += paiement.eleves.length;
    });
    // Sort months chronologically
    const moisTries = Object.keys(paiementsParMois).sort((a, b) => {
        const [moisA, anneeA] = a.split(' ');
        const [moisB, anneeB] = b.split(' ');
        const indexA = nomsMois.indexOf(moisA);
        const indexB = nomsMois.indexOf(moisB);
        if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
        return indexA - indexB;
    });
    for (const mois of moisTries) {
        const row = detailsMensuels.insertRow();
        row.insertCell(0).innerHTML = `<span class="month-name">${mois}</span>`;
        row.insertCell(1).textContent = paiementsParMois[mois].nombrePaiements;
        row.insertCell(2).textContent = paiementsParMois[mois].montantTotal.toLocaleString('fr-FR') + ' FCFA';
        row.insertCell(3).textContent = paiementsParMois[mois].nombreEleves;
    }
    if (Object.keys(paiementsParMois).length > 0) {
        const totalRow = detailsMensuels.insertRow();
        totalRow.className = 'total-row';
        totalRow.insertCell(0).textContent = 'TOTAL';
        totalRow.insertCell(1).textContent = paiements.length;
        const totalMontant = paiements.reduce((total, p) => total + p.montantVerse, 0);
        totalRow.insertCell(2).textContent = totalMontant.toLocaleString('fr-FR') + ' FCFA';
        const totalEleves = paiements.reduce((total, p) => total + p.eleves.length, 0);
        totalRow.insertCell(3).textContent = totalEleves;
    }
}

function formaterDate(date) {
    const jour = date.getDate().toString().padStart(2, '0');
    const mois = (date.getMonth() + 1).toString().padStart(2, '0');
    const annee = date.getFullYear();
    return `${jour}/${mois}/${annee}`;
}

// Fonction pour afficher les derniers paiements
function afficherDerniersPaiements() {
    const container = document.getElementById('derniers-paiements');
    container.innerHTML = '';
    
    if (paiements.length === 0) {
        container.innerHTML = '<p class="text-center">Aucun paiement enregistré pour le moment</p>';
        return;
    }
    
    // Trier les paiements par date (du plus récent au plus ancien)
    const paiementsTries = [...paiements].sort((a, b) => {
        const dateA = parseDateFr(a.datePaiement);
        const dateB = parseDateFr(b.datePaiement);
        return dateB - dateA;
    });
    
    // Prendre les 5 derniers paiements
    const derniersPaiements = paiementsTries.slice(0, 5);
    
    derniersPaiements.forEach(paiement => {
        const item = document.createElement('div');
        item.className = 'dernier-paiement-item';
        
        const info = document.createElement('div');
        info.className = 'paiement-info';
        info.innerHTML = `
            <div><strong>${paiement.nomParent}</strong></div>
            <div>${paiement.eleves.map(e => e.nom).join(', ') || 'Paiement de dette'}</div>
            <div class="paiement-date">${paiement.datePaiement}</div>
        `;
        
        const montant = document.createElement('div');
        montant.className = 'paiement-montant';
        montant.textContent = `${paiement.montantVerse.toLocaleString('fr-FR')} FCFA`;
        
        item.appendChild(info);
        item.appendChild(montant);
        container.appendChild(item);
    });
}

// Fonction pour supprimer un paiement
function supprimerPaiement(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.")) {
        // Trouver l'index du paiement
        const index = paiements.findIndex(p => p.id === id);
        
        if (index !== -1) {
            // Supprimer le paiement du tableau
            paiements.splice(index, 1);
            
            // Sauvegarder les données modifiées
            sauvegarderPaiements();
            
            // Mettre à jour l'affichage
            const tbody = document.querySelector('#tableau-paiements tbody');
            tbody.innerHTML = '';
            paiements.forEach(paiement => {
                afficherPaiementDansTableau(paiement);
            });
            
            // Mettre à jour les derniers paiements
            afficherDerniersPaiements();
            
            // Mettre à jour le budget
            mettreAJourBudget();
            
            alert("Paiement supprimé avec succès !");
        }
    }
}

// Fonction pour afficher un paiement dans le tableau
// Version améliorée avec gestion d'erreurs
function afficherPaiementDansTableau(paiement) {
    try {
        // Vérifier que le paiement existe
        if (!paiement) {
            console.error('Paiement non défini');
            return;
        }
        
        // Vérifier les données obligatoires
        if (!paiement.nomParent || !paiement.telephone) {
            console.warn('Paiement avec données manquantes:', paiement);
        }
        
        const tbody = document.querySelector('#tableau-paiements tbody');
        
        // Vérifier que le tableau existe
        if (!tbody) {
            console.error('Tableau des paiements introuvable');
            return;
        }
        
        const newRow = tbody.insertRow();
        
        // Ajouter un ID à la ligne pour faciliter la sélection ultérieure
        newRow.setAttribute('data-paiement-id', paiement.id);
        
        // Fonction utilitaire pour échapper le HTML
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // Cellules avec échappement HTML pour la sécurité
        newRow.insertCell(0).textContent = escapeHtml(paiement.nomParent);
        newRow.insertCell(1).textContent = escapeHtml(paiement.telephone);
        
        // Gestion des élèves avec vérification
        const nomsEleves = paiement.eleves && Array.isArray(paiement.eleves) 
            ? paiement.eleves.map(e => e.nom).join(', ') 
            : 'Aucun élève ajouté (paiement dette)';
        newRow.insertCell(2).textContent = nomsEleves;
        
        const classesEleves = paiement.eleves && Array.isArray(paiement.eleves)
            ? paiement.eleves.map(e => e.classe).join(', ')
            : '-';
        newRow.insertCell(3).textContent = classesEleves;
        
        // Formatage des montants avec vérification
        const montantVerse = isNaN(paiement.montantVerse) ? 0 : paiement.montantVerse;
        const reste = isNaN(paiement.reste) ? 0 : paiement.reste;
        
        newRow.insertCell(4).textContent = `${montantVerse.toLocaleString('fr-FR')} FCFA`;
        newRow.insertCell(5).textContent = `${reste.toLocaleString('fr-FR')} FCFA`;
        newRow.insertCell(6).textContent = escapeHtml(paiement.datePaiement || 'Date non définie');
        
        // Cellule d'actions avec gestion sécurisée des événements
        const actionCell = newRow.insertCell(7);
        actionCell.className = 'no-print actions-cell';
        
        // Créer les boutons via DOM pour plus de sécurité
        const btnSMS = document.createElement('button');
        btnSMS.className = 'sms';
        btnSMS.textContent = '📱';
        btnSMS.title = 'Envoyer SMS';
        btnSMS.onclick = () => envoyerSMS(paiement.telephone, paiement.nomParent, montantVerse, reste);
        
        const btnDetails = document.createElement('button');
        btnDetails.textContent = '📋';
        btnDetails.title = 'Voir détails';
        btnDetails.onclick = (e) => afficherDetails(e.target);
        
        const btnRecap = document.createElement('button');
        btnRecap.textContent = '📊';
        btnRecap.title = 'Récapitulatif parent';
        btnRecap.onclick = () => genererRecapParent(paiement.nomParent);
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'delete';
        btnDelete.textContent = '🗑️';
        btnDelete.title = 'Supprimer';
        btnDelete.onclick = () => supprimerPaiement(paiement.id);
        
        actionCell.appendChild(btnSMS);
        actionCell.appendChild(btnDetails);
        actionCell.appendChild(btnRecap);
        actionCell.appendChild(btnDelete);
        
        // Style conditionnel pour le reste
        const resteCell = newRow.cells[5];
        if (reste > 0) {
            resteCell.classList.add('reste-positive');
        } else {
            resteCell.classList.add('reste-zero');
        }
        
        // Animation d'apparition
        newRow.style.opacity = '0';
        setTimeout(() => {
            newRow.style.transition = 'opacity 0.3s ease-in';
            newRow.style.opacity = '1';
        }, 10);
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage du paiement:', error, paiement);
    }
}

function validerTelephone(telephone) {
    return /^[0-9+\-\s()]{8,}$/.test(telephone);
}

function validerMontant(montant) {
    return !isNaN(montant) && montant >= 0;
}

function enregistrerPaiement() {
    const nomParent = document.getElementById('nom-parent').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const adresse = document.getElementById('adresse').value.trim();
    const montantVerse = parseFloat(document.getElementById('montant-verse').value.trim()) || 0;
    const observations = document.getElementById('observations').value.trim();
    
    if (!nomParent || !telephone) {
        alert("Veuillez remplir les informations du parent (nom et téléphone).");
        return;
    }
    
    // Vérification différente selon si c'est un parent existant ou non
    if (!parentExistant && eleves.length === 0) {
        alert("Veuillez ajouter au moins un élève pour un nouveau parent.");
        return;
    }
    
    let montantTotal = 0;
    
    // Si c'est un parent existant et qu'aucun élève n'est ajouté
    if (parentExistant && eleves.length === 0) {
        montantTotal = totalRestePrecedent;
    } 
    // Si des élèves sont ajoutés (nouveau parent ou parent existant)
    else {
        montantTotal = eleves.length * cotisationParEleve;
        
        // Ajouter le solde précédent pour les parents existants
        if (parentExistant) {
            montantTotal += totalRestePrecedent;
        }
    }
    
    const reste = montantTotal - montantVerse;
    const datePaiement = formaterDate(new Date());
    
    // Créer l'objet paiement
    const paiement = {
        id: Date.now(), // ID unique basé sur le timestamp
        nomParent,
        telephone,
        adresse,
        eleves: [...eleves], // Copie du tableau d'élèves
        montantTotal,
        montantVerse,
        reste,
        observations,
        datePaiement
    };
    
    // Ajouter au tableau des paiements
    paiements.push(paiement);
    
    // Sauvegarder dans le localStorage
    sauvegarderPaiements();
    
    // Mettre à jour l'affichage
    afficherPaiementDansTableau(paiement);
    
    // Mettre à jour les derniers paiements
    afficherDerniersPaiements();
    
    // Mettre à jour le budget
    mettreAJourBudget();
    
    // Réinitialiser le formulaire
    reinitialiserFormulaire();
    
    alert("Paiement enregistré avec succès !");
}

// Fonction pour vérifier si un parent existe déjà
function verifierParent() {
    const nomParent = document.getElementById('nom-parent').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    
    if (nomParent && telephone) {
        // Normaliser les données pour la comparaison
        const nomParentNormalise = nomParent.toLowerCase().replace(/\s+/g, ' ');
        const telephoneNormalise = telephone.replace(/\s+/g, '');
        
        // Rechercher si ce parent existe déjà (avec comparaison normalisée)
        const paiementsParent = paiements.filter(p => {
            const pNomNormalise = p.nomParent.toLowerCase().replace(/\s+/g, ' ');
            const pTelNormalise = p.telephone.replace(/\s+/g, '');
            return pNomNormalise === nomParentNormalise && pTelNormalise === telephoneNormalise;
        });
        
        if (paiementsParent.length > 0) {
            parentExistant = paiementsParent[paiementsParent.length - 1];
            
            // Calculer le solde restant pour ce parent
            totalRestePrecedent = 0;
            paiementsParent.forEach(p => {
                totalRestePrecedent += p.reste;
            });
            
            // Afficher l'alerte pour préremplir
            afficherAlerteParentExistant(nomParent, telephone, totalRestePrecedent);
        } else {
            parentExistant = null;
            totalRestePrecedent = 0;
            
            // Nouveau parent - créer un dossier
            const infoParent = document.getElementById('info-parent');
            const statutParent = document.getElementById('statut-parent');
            const detailsParent = document.getElementById('details-parent');
            
            infoParent.style.display = 'block';
            infoParent.className = 'parent-info parent-nouveau';
            statutParent.textContent = 'Nouveau parent';
            detailsParent.innerHTML = '<p>Aucun historique trouvé pour ce parent. Un nouveau dossier sera créé.</p>';
            
            // Cacher l'alerte de paiement de dette
            document.getElementById('paiement-dette').style.display = 'none';
            
            // Réinitialiser le montant total
            calculerMontantTotal();
        }
    }
}

// Fonction pour afficher une alerte lorsque le parent existe déjà
function afficherAlerteParentExistant(nomParent, telephone, solde) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-parent';
    alertDiv.innerHTML = `
        <h3>Parent existant détecté</h3>
        <p>Nous avons trouvé un dossier pour <strong>${nomParent}</strong> (${telephone}).</p>
        <p>Solde précédent: <strong>${solde.toLocaleString('fr-FR')} FCFA</strong></p>
        <p>Souhaitez-vous préremplir les informations de ce parent?</p>
        <div class="alert-buttons">
            <button onclick="prefillParentInfo()">Oui, préremplir</button>
            <button onclick="closeAlert()" style="background: #f44336;">Non, continuer</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(alertDiv);
}

// Fonction pour fermer l'alerte
function closeAlert() {
    const overlay = document.querySelector('.overlay');
    const alertDiv = document.querySelector('.alert-parent');
    
    if (overlay) document.body.removeChild(overlay);
    if (alertDiv) document.body.removeChild(alertDiv);
    
    // Mettre à jour l'affichage du parent existant
    const infoParent = document.getElementById('info-parent');
    const statutParent = document.getElementById('statut-parent');
    const detailsParent = document.getElementById('details-parent');
    
    infoParent.style.display = 'block';
    infoParent.className = 'parent-info parent-existant';
    statutParent.textContent = 'Parent existant';
    detailsParent.innerHTML = `
        <p><strong>Solde précédent:</strong> ${totalRestePrecedent.toLocaleString('fr-FR')} FCFA</p>
        <p><strong>Note:</strong> Les informations n'ont pas été préremplies.</p>
    `;
    
    // Afficher l'alerte de paiement de dette seulement
    document.getElementById('paiement-dette').style.display = 'block';
    
    // Calculer le montant total
    calculerMontantTotal();
}

// Fonction pour préremplir les informations du parent
function prefillParentInfo() {
    const overlay = document.querySelector('.overlay');
    const alertDiv = document.querySelector('.alert-parent');
    
    if (overlay) document.body.removeChild(overlay);
    if (alertDiv) document.body.removeChild(alertDiv);
    
    // Préremplir les informations du parent
    document.getElementById('nom-parent').value = parentExistant.nomParent;
    document.getElementById('telephone').value = parentExistant.telephone;
    document.getElementById('adresse').value = parentExistant.adresse || '';
    
    // Mettre à jour l'affichage du parent existant
    const infoParent = document.getElementById('info-parent');
    const statutParent = document.getElementById('statut-parent');
    const detailsParent = document.getElementById('details-parent');
    
    infoParent.style.display = 'block';
    infoParent.className = 'parent-info parent-existant';
    statutParent.textContent = 'Parent existant - Informations préremplies';
    detailsParent.innerHTML = `
        <p><strong>Solde précédent:</strong> ${totalRestePrecedent.toLocaleString('fr-FR')} FCFA</p>
        <p><strong>Élèves précédents:</strong> ${parentExistant.eleves.map(e => e.nom).join(', ')}</p>
    `;
    
    // Afficher l'alerte de paiement de dette seulement
    document.getElementById('paiement-dette').style.display = 'block';
    
    // Calculer le montant total
    calculerMontantTotal();
}

// Fonction pour ajouter un élève
function ajouterEleve() {
    const nomEleve = document.getElementById('nom-eleve').value;
    const classe = document.getElementById('classe').value;
    
    if (!nomEleve || !classe) {
        alert("Veuillez remplir le nom et la classe de l'élève.");
        return;
    }
    
    eleves.push({ nom: nomEleve, classe: classe });
    afficherEleves();
    
    // Cacher l'alerte de paiement de dette si on ajoute un élève
    document.getElementById('paiement-dette').style.display = 'none';
    
    // Réinitialiser les champs
    document.getElementById('nom-eleve').value = '';
    document.getElementById('classe').value = '';
    
    // Calculer le montant total
    calculerMontantTotal();
}

// Fonction pour afficher la liste des élèves
function afficherEleves() {
    const listeEleves = document.getElementById('liste-eleves');
    listeEleves.innerHTML = '';
    
    eleves.forEach((eleve, index) => {
        const div = document.createElement('div');
        div.className = 'student-item';
        div.innerHTML = `
            <div>${eleve.nom} (${eleve.classe})</div>
            <button class="no-print" onclick="supprimerEleve(${index})">✕</button>
        `;
        listeEleves.appendChild(div);
    });
}

// Fonction pour supprimer un élève
function supprimerEleve(index) {
    eleves.splice(index, 1);
    afficherEleves();
    
    // Afficher l'alerte de paiement de dette si on supprime tous les élèves pour un parent existant
    if (eleves.length === 0 && parentExistant) {
        document.getElementById('paiement-dette').style.display = 'block';
    }
    
    calculerMontantTotal();
}

// Fonction pour calculer le montant total
function calculerMontantTotal() {
    let montantTotal = 0;
    
    // Si c'est un parent existant et qu'aucun élève n'est ajouté
    if (parentExistant && eleves.length === 0) {
        montantTotal = totalRestePrecedent;
    } 
    // Si des élèves sont ajoutés (nouveau parent ou parent existant)
    else {
        montantTotal = eleves.length * cotisationParEleve;
        
        // Ajouter le solde précédent pour les parents existants
        if (parentExistant) {
            montantTotal += totalRestePrecedent;
        }
    }
    
    document.getElementById('montant-total').value = `${montantTotal.toLocaleString('fr-FR')} FCFA`;
    calculerReste();
}

// Fonction pour calculer le reste à payer
function calculerReste() {
    let montantTotal = 0;
    
    // Si c'est un parent existant et qu'aucun élève n'est ajouté
    if (parentExistant && eleves.length === 0) {
        montantTotal = totalRestePrecedent;
    } 
    // Si des élèves sont ajoutés (nouveau parent ou parent existant)
    else {
        montantTotal = eleves.length * cotisationParEleve;
        
        // Ajouter le solde précédent pour les parents existants
        if (parentExistant) {
            montantTotal += totalRestePrecedent;
        }
    }
    
    const montantVerse = parseFloat(document.getElementById('montant-verse').value) || 0;
    const reste = montantTotal - montantVerse;
    
    document.getElementById('reste-payer').value = `${reste.toLocaleString('fr-FR')} FCFA`;
    
    // Changer la couleur si reste à payer
    if (reste > 0) {
        document.getElementById('reste-payer').style.color = '#d32f2f';
    } else {
        document.getElementById('reste-payer').style.color = '#388E3C';
    }
}

// Fonction pour sauvegarder les paiements
function sauvegarderPaiements() {
    localStorage.setItem('apee_paiements', JSON.stringify(paiements));
}

// Fonction pour charger les paiements
function chargerPaiements() {
    const paiementsSauvegardes = localStorage.getItem('apee_paiements');
    if (paiementsSauvegardes) {
        try {
            const data = JSON.parse(paiementsSauvegardes);
            
            // Vérifier si c'est un backup complet ou juste le tableau de paiements
            if (data && data.paiements && Array.isArray(data.paiements)) {
                // C'est un backup complet
                paiements = data.paiements;
            } else if (Array.isArray(data)) {
                // C'est juste le tableau de paiements
                paiements = data;
            } else {
                console.error("Format de données inconnu, initialisation avec un tableau vide");
                paiements = [];
            }
            
            // Afficher tous les paiements dans le tableau
            paiements.forEach(paiement => {
                afficherPaiementDansTableau(paiement);
            });
            
            // Afficher les derniers paiements
            afficherDerniersPaiements();
        } catch (error) {
            console.error("Erreur lors du chargement des données:", error);
            paiements = [];
        }
    }
}

// Fonction pour envoyer un SMS
function envoyerSMS(tel, nom, montant, solde) {
    let telephone = tel;
    let nomParent = nom;
    let montantVerse = montant;
    let reste = solde;
    
    if (!telephone) {
        telephone = document.getElementById('telephone').value;
        // Utiliser des variables locales au lieu des paramètres
        nomParent = document.getElementById('nom-parent').value;
        montantVerse = parseFloat(document.getElementById('montant-verse').value) || 0;
        
        let montantTotal = 0;
        if (parentExistant && eleves.length === 0) {
            montantTotal = totalRestePrecedent;
        } else {
            montantTotal = eleves.length * cotisationParEleve;
            if (parentExistant) {
                montantTotal += totalRestePrecedent;
            }
        }
       reste = montantTotal - montantVerse;
    }
    const message = `APEE CES EKALI 1 - Récap. ${nomParent}: ${montantVerse.toLocaleString('fr-FR')} FCFA versés, ${reste.toLocaleString('fr-FR')} FCFA restants. Merci !`;
    
    alert(`SMS serait envoyé au ${telephone}:\n\n${message}`);
}

// Fonction pour afficher un récapitulatif
function afficherRecap() {
    const nomParent = document.getElementById('nom-parent').value;
    const telephone = document.getElementById('telephone').value;
    const montantVerse = parseFloat(document.getElementById('montant-verse').value) || 0;
    
    let montantTotal = 0;
    
    // Si c'est un parent existant et qu'aucun élève n'est ajouté
    if (parentExistant && eleves.length === 0) {
        montantTotal = totalRestePrecedent;
    } 
    // Si des élèves sont ajoutés (nouveau parent ou parent existant)
    else {
        montantTotal = eleves.length * cotisationParEleve;
        
        // Ajouter le solde précédent pour les parents existants
        if (parentExistant) {
            montantTotal += totalRestePrecedent;
        }
    }
    
    const reste = montantTotal - montantVerse;
    
    if (!parentExistant && eleves.length === 0) {
        alert("Veuillez d'abord ajouter au moins un élève.");
        return;
    }
    
    let recap = `RÉCAPITULATIF - APEE CES EKALI 1\n\n`;
    recap += `Parent: ${nomParent}\n`;
    recap += `Téléphone: ${telephone}\n\n`;
    
    if (eleves.length > 0) {
        recap += `Élève(s):\n`;
        eleves.forEach(eleve => {
            recap += `- ${eleve.nom} (${eleve.classe})\n`;
        });
        recap += `\n`;
    } else if (parentExistant) {
        recap += `Aucun nouvel élève ajouté (paiement de dette seulement)\n\n`;
    }
    
    if (parentExistant && totalRestePrecedent > 0) {
        recap += `Solde précédent: ${totalRestePrecedent.toLocaleString('fr-FR')} FCFA\n`;
    }
    
    recap += `Montant total: ${montantTotal.toLocaleString('fr-FR')} FCFA\n`;
    recap += `Montant versé: ${montantVerse.toLocaleString('fr-FR')} FCFA\n`;
    recap += `Reste à payer: ${reste.toLocaleString('fr-FR')} FCFA\n`;
    
    alert(recap);
}

// Fonction pour afficher les détails d'un paiement
function afficherDetails(button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');
    
    let details = `DÉTAILS DU PAIEMENT\n\n`;
    details += `Parent: ${cells[0].textContent}\n`;
    details += `Téléphone: ${cells[1].textContent}\n`;
    details += `Élève(s): ${cells[2].textContent}\n`;
    details += `Classe(s): ${cells[3].textContent}\n`;
    details += `Montant versé: ${cells[4].textContent}\n`;
    details += `Reste à payer: ${cells[5].textContent}\n`;
    details += `Date: ${cells[6].textContent}\n`;
    
    alert(details);
}

// Fonction pour réinitialiser le formulaire
function reinitialiserFormulaire() {
    document.getElementById('nom-parent').value = '';
    document.getElementById('telephone').value = '';
    document.getElementById('adresse').value = '';
    document.getElementById('montant-verse').value = '';
    document.getElementById('observations').value = '';
    eleves = [];
    parentExistant = null;
    totalRestePrecedent = 0;
    document.getElementById('info-parent').style.display = 'none';
    document.getElementById('paiement-dette').style.display = 'none';
    afficherEleves();
    calculerMontantTotal();
}

// Fonction pour imprimer l'historique
function imprimerHistorique() {
    window.print();
}

// Fonction pour générer un récapitulatif par parent
function genererRecapParent(nomParent) {
    // Trouver tous les paiements de ce parent
    const paiementsParent = paiements.filter(p => p.nomParent === nomParent);
    
    if (paiementsParent.length === 0) {
        alert(`Aucun paiement trouvé pour ${nomParent}`);
        return;
    }
    
    let contenu = `<div class="recap-parent">
        <h3>Récapitulatif pour: ${nomParent}</h3>
        <p><strong>Téléphone:</strong> ${paiementsParent[0].telephone}</p>`;
    
    if (paiementsParent[0].adresse) {
        contenu += `<p><strong>Adresse:</strong> ${paiementsParent[0].adresse}</p>`;
    }
    
    contenu += `<table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Élève(s)</th>
                <th>Classe(s)</th>
                <th>Montant versé</th>
                <th>Reste à payer</th>
            </tr>
        </thead>
        <tbody>`;
    
    let totalVerse = 0;
    let totalReste = 0;
    
    paiementsParent.forEach(p => {
        contenu += `<tr>
            <td>${p.datePaiement}</td>
            <td>${p.eleves.map(e => e.nom).join(', ') || 'Aucun élève ajouté (paiement dette)'}</td>
            <td>${p.eleves.map(e => e.classe).join(', ') || '-'}</td>
            <td>${p.montantVerse.toLocaleString('fr-FR')} FCFA</td>
            <td>${p.reste.toLocaleString('fr-FR')} FCFA</td>
        </tr>`;
        
        totalVerse += p.montantVerse;
        totalReste += p.reste;
    });
    
    contenu += `<tr class="total-row">
        <td colspan="3"><strong>TOTAUX</strong></td>
        <td><strong>${totalVerse.toLocaleString('fr-FR')} FCFA</strong></td>
        <td><strong>${totalReste.toLocaleString('fr-FR')} FCFA</strong></td>
    </tr>`;
    
    contenu += `</tbody></table></div>`;
    
    // Afficher dans le conteneur de récapitulatif
    document.getElementById('contenu-recap').innerHTML = contenu;
    document.getElementById('date-recap').textContent = new Date().toLocaleDateString();
    document.getElementById('recap-global').style.display = 'block';
}

// Fonction pour générer un récapitulatif global
function genererRecapGlobal() {
    // Regrouper les paiements par parent
    const paiementsParParent = {};
    
    paiements.forEach(p => {
        if (!paiementsParParent[p.nomParent]) {
            paiementsParParent[p.nomParent] = [];
        }
        paiementsParParent[p.nomParent].push(p);
    });
    
    let contenu = '';
    
    // Pour chaque parent, générer un récapitulatif
    for (const nomParent in paiementsParParent) {
        const paiementsParent = paiementsParParent[nomParent];
        
        let totalVerse = 0;
        let totalReste = 0;
        
        contenu += `<div class="recap-parent">
            <h3>${nomParent}</h3>
            <p><strong>Téléphone:</strong> ${paiementsParent[0].telephone}</p>`;
        
        if (paiementsParent[0].adresse) {
            contenu += `<p><strong>Adresse:</strong> ${paiementsParent[0].adresse}</p>`;
        }
        
        contenu += `<table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Élève(s)</th>
                    <th>Classe(s)</th>
                    <th>Montant versé</th>
                    <th>Reste à payer</th>
                </tr>
            </thead>
            <tbody>`;
        
        paiementsParent.forEach(p => {
            contenu += `<tr>
                <td>${p.datePaiement}</td>
                <td>${p.eleves.map(e => e.nom).join(', ') || 'Aucun élève ajouté (paiement dette)'}</td>
                <td>${p.eleves.map(e => e.classe).join(', ') || '-'}</td>
                <td>${p.montantVerse.toLocaleString('fr-FR')} FCFA</td>
                <td>${p.reste.toLocaleString('fr-FR')} FCFA</td>
            </tr>`;
            
            totalVerse += p.montantVerse;
            totalReste += p.reste;
        });
        
        contenu += `<tr class="total-row">
            <td colspan="3"><strong>TOTAUX</strong></td>
            <td><strong>${totalVerse.toLocaleString('fr-FR')} FCFA</strong></td>
            <td><strong>${totalReste.toLocaleString('fr-FR')} FCFA</strong></td>
        </tr>`;
        
        contenu += `</tbody></table></div>`;
    }
    
    // Afficher dans le conteneur de récapitulatif
    document.getElementById('contenu-recap').innerHTML = contenu;
    document.getElementById('date-recap').textContent = new Date().toLocaleDateString();
    document.getElementById('recap-global').style.display = 'block';
}

// Fonction pour imprimer le récapitulatif
function imprimerRecap() {
    const contenu = document.getElementById('recap-global').innerHTML;
    const ventreeImpression = window.open('', '_blank');
    ventreeImpression.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Récapitulatif des Paiements - APEE EKALI 1</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; background-color: #e8f5e9; }
                .recap-parent { margin-bottom: 30px; page-break-inside: avoid; }
                h3 { color: #2c3e50; }
            </style>
        </head>
        <body>
            <h1 style="text-align: center;">Récapitulatif des Paiements - APEE CES EKALI 1</h1>
            <p style="text-align: center;">Date de génération: ${new Date().toLocaleDateString()}</p>
            ${contenu}
        </body>
        </html>
    `);
    ventreeImpression.document.close();
    ventreeImpression.print();
}

// Fonction pour fermer le récapitulatif
function fermerRecap() {
    document.getElementById('recap-global').style.display = 'none';
}

// Fonction pour exporter les données
function exporterDonnees() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paiements, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "apee_paiements_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// ==============================================
// FONCTIONS DE GESTION DES FICHIERS
// ==============================================

// Fonction pour exporter les paiements vers un fichier JSON
function exporterPaiements() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paiements, null, 2));
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `apee_paiements_${dateStr}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    alert(`Fichier exporté avec succès! Nom: apee_paiements_${dateStr}.json`);
}

// Fonction pour importer des paiements depuis un fichier JSON
function importerPaiements() {
    const fileInput = document.getElementById('file-input');
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!Array.isArray(data)) throw new Error("Format invalide");
                paiements = data;
                sauvegarderPaiements();
                
                // Mettre à jour l'affichage
                const tbody = document.querySelector('#tableau-paiements tbody');
                tbody.innerHTML = '';
                paiements.forEach(paiement => {
                    afficherPaiementDansTableau(paiement);
                });
                
                afficherDerniersPaiements();
                mettreAJourBudget();
                alert('Import réussi !');
            } catch (err) {
                alert("Fichier JSON invalide ou corrompu!");
            }
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

// Fonction pour sauvegarder un backup complet
function sauvegarderBackup() {
    const backupData = {
        version: "1.0",
        dateSauvegarde: new Date().toISOString(),
        paiements: paiements
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `apee_backup_complet_${dateStr}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    alert(`Backup complet sauvegardé! Nom: apee_backup_complet_${dateStr}.json`);
}

// Fonction pour imprimer le rapport budget
// ... (le code précédent reste inchangé jusqu'à la fonction imprimerRapportBudget)

// Fonction pour imprimer le rapport budget
function imprimerRapportBudget() {
    // Récupérer les données du budget
    const totalCotisations = paiements.reduce((total, paiement) => total + paiement.montantVerse, 0);
    const objectifRecettes = 100 * cotisationParEleve;
    const tauxRealisation = objectifRecettes > 0 ? (totalCotisations / objectifRecettes) * 100 : 0;
    
    // Calculer les détails mensuels
    const paiementsParMois = {};
    paiements.forEach(paiement => {
        let datePaiement = parseDateFr(paiement.datePaiement);
        const moisAnnee = `${nomsMois[datePaiement.getMonth()]} ${datePaiement.getFullYear()}`;
        if (!paiementsParMois[moisAnnee]) {
            paiementsParMois[moisAnnee] = { montantTotal: 0, nombrePaiements: 0, nombreEleves: 0 };
        }
        paiementsParMois[moisAnnee].montantTotal += paiement.montantVerse;
        paiementsParMois[moisAnnee].nombrePaiements += 1;
        paiementsParMois[moisAnnee].nombreEleves += paiement.eleves.length;
    });
    
    // Trier les mois chronologiquement
    const moisTries = Object.keys(paiementsParMois).sort((a, b) => {
        const [moisA, anneeA] = a.split(' ');
        const [moisB, anneeB] = b.split(' ');
        const indexA = nomsMois.indexOf(moisA);
        const indexB = nomsMois.indexOf(moisB);
        if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
        return indexA - indexB;
    });
    
    // Créer le contenu HTML du rapport
    let rapportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Rapport Budget - APEE CES D'EKALI 1</title>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #4CAF50;
                }
                .stats-container {
                    display: flex;
                    justify-content: space-around;
                    margin: 20px 0;
                    flex-wrap: wrap;
                }
                .stat-box {
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 5px;
                    text-align: center;
                    min-width: 200px;
                    margin: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .stat-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #4CAF50;
                }
                .progress-container {
                    margin: 20px 0;
                }
                .progress-bar {
                    height: 20px;
                    background-color: #e0e0e0;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background-color: #4CAF50;
                    border-radius: 10px;
                }
                .progress-text {
                    text-align: center;
                    margin-top: 5px;
                    font-weight: bold;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #f2f7f9;
                    font-weight: 600;
                }
                .total-row {
                    font-weight: bold;
                    background-color: #e8f5e9;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>APEE DU CES D'EKALI 1</h1>
                <h2>RAPPORT BUDGET - IMPACT DES COTISATIONS</h2>
                <p>Date du rapport: ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <div class="stats-container">
                <div class="stat-box">
                    <h3>Objectif de Recettes</h3>
                    <div class="stat-value">${objectifRecettes.toLocaleString('fr-FR')} FCFA</div>
                    <p>Cotisations attendues (100 élèves × 12 500 FCFA)</p>
                </div>
                
                <div class="stat-box">
                    <h3>Recettes Réalisées</h3>
                    <div class="stat-value">${totalCotisations.toLocaleString('fr-FR')} FCFA</div>
                    <p>Total des cotisations perçues</p>
                </div>
                
                <div class="stat-box">
                    <h3>Taux de Réalisation</h3>
                    <div class="stat-value">${tauxRealisation.toFixed(1)}%</div>
                    <p>Pourcentage de l'objectif atteint</p>
                </div>
            </div>
            
            <div class="progress-container">
                <h3>Progression vers l'objectif</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(tauxRealisation, 100)}%"></div>
                </div>
                <div class="progress-text">${Math.min(tauxRealisation, 100).toFixed(1)}%</div>
            </div>
            
            <h3>Détail des cotisations par mois</h3>
            <table>
                <thead>
                    <tr>
                        <th>Mois</th>
                        <th>Nombre de paiements</th>
                        <th>Montant perçu</th>
                        <th>Élèves concernés</th>
                    </tr>
                </thead>
                <tbody>`;
    
    // Ajouter les lignes du tableau pour chaque mois
    let totalPaiements = 0;
    let totalMontant = 0;
    let totalEleves = 0;
    
    for (const mois of moisTries) {
        const data = paiementsParMois[mois];
        rapportHTML += `
                    <tr>
                        <td>${mois}</td>
                        <td>${data.nombrePaiements}</td>
                        <td>${data.montantTotal.toLocaleString('fr-FR')} FCFA</td>
                        <td>${data.nombreEleves}</td>
                    </tr>`;
        
        totalPaiements += data.nombrePaiements;
        totalMontant += data.montantTotal;
        totalEleves += data.nombreEleves;
    }
    
    // Ajouter la ligne de total
    rapportHTML += `
                    <tr class="total-row">
                        <td>TOTAL</td>
                        <td>${totalPaiements}</td>
                        <td>${totalMontant.toLocaleString('fr-FR')} FCFA</td>
                        <td>${totalEleves}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="footer">
                <p>Généré par le système de gestion des cotisations - APEE CES D'EKALI 1</p>
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Imprimer le rapport
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                    Fermer
                </button>
            </div>
        </body>
        </html>
    `;
    
    // Ouvrir une nouvelle fenêtre avec le rapport
    const fenetreRapport = window.open('', '_blank');
    fenetreRapport.document.write(rapportHTML);
    fenetreRapport.document.close();
    
    // Donner le focus à la fenêtre pour l'impression
    fenetreRapport.focus();
}

// Fonction pour exporter le rapport budget
function exporterRapportBudget() {
    // Récupérer les données du budget
    const totalCotisations = paiements.reduce((total, paiement) => total + paiement.montantVerse, 0);
    const objectifRecettes = 100 * cotisationParEleve;
    const tauxRealisation = objectifRecettes > 0 ? (totalCotisations / objectifRecettes) * 100 : 0;
    
    // Calculer les détails mensuels
    const paiementsParMois = {};
    paiements.forEach(paiement => {
        let datePaiement = parseDateFr(paiement.datePaiement);
        const moisAnnee = `${nomsMois[datePaiement.getMonth()]} ${datePaiement.getFullYear()}`;
        if (!paiementsParMois[moisAnnee]) {
            paiementsParMois[moisAnnee] = { montantTotal: 0, nombrePaiements: 0, nombreEleves: 0 };
        }
        paiementsParMois[moisAnnee].montantTotal += paiement.montantVerse;
        paiementsParMois[moisAnnee].nombrePaiements += 1;
        paiementsParMois[moisAnnee].nombreEleves += paiement.eleves.length;
    });
    
    // Trier les mois chronologiquement
    const moisTries = Object.keys(paiementsParMois).sort((a, b) => {
        const [moisA, anneeA] = a.split(' ');
        const [moisB, anneeB] = b.split(' ');
        const indexA = nomsMois.indexOf(moisA);
        const indexB = nomsMois.indexOf(moisB);
        if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
        return indexA - indexB;
    });
    
    // Préparer le contenu CSV
    let csvContent = "APEE DU CES D'EKALI 1 - RAPPORT BUDGET\n";
    csvContent += `Date de génération: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    
    // Section Statistiques Globales
    csvContent += "STATISTIQUES GLOBALES\n";
    csvContent += `Objectif de recettes,${objectifRecettes} FCFA\n`;
    csvContent += `Recettes réalisées,${totalCotisations} FCFA\n`;
    csvContent += `Taux de réalisation,${tauxRealisation.toFixed(2)}%\n\n`;
    
    // Section Détail Mensuel
    csvContent += "DÉTAIL MENSUEL\n";
    csvContent += "Mois,Nombre de paiements,Montant perçu (FCFA),Élèves concernés\n";
    
    let totalPaiements = 0;
    let totalMontant = 0;
    let totalEleves = 0;
    
    for (const mois of moisTries) {
        const data = paiementsParMois[mois];
        csvContent += `${mois},${data.nombrePaiements},${data.montantTotal},${data.nombreEleves}\n`;
        
        totalPaiements += data.nombrePaiements;
        totalMontant += data.montantTotal;
        totalEleves += data.nombreEleves;
    }
    
    // Ligne de totaux
    csvContent += `TOTAL,${totalPaiements},${totalMontant},${totalEleves}\n\n`;
    
    // Section Détail par Parent (optionnel)
    csvContent += "DÉTAIL PAR PARENT (TOP 10)\n";
    csvContent += "Parent,Téléphone,Montant total versé (FCFA),Nombre d'élèves,Reste à payer (FCFA)\n";
    
    // Regrouper les paiements par parent
    const paiementsParParent = {};
    paiements.forEach(p => {
        const cle = `${p.nomParent}|${p.telephone}`;
        if (!paiementsParParent[cle]) {
            paiementsParParent[cle] = {
                nom: p.nomParent,
                telephone: p.telephone,
                montantTotal: 0,
                resteTotal: 0,
                nbEleves: 0
            };
        }
        paiementsParParent[cle].montantTotal += p.montantVerse;
        paiementsParParent[cle].resteTotal += p.reste;
        paiementsParParent[cle].nbEleves += p.eleves.length;
    });
    
    // Trier par montant total (décroissant) et prendre les 10 premiers
    const parentsTries = Object.values(paiementsParParent)
        .sort((a, b) => b.montantTotal - a.montantTotal)
        .slice(0, 10);
    
    parentsTries.forEach(parent => {
        csvContent += `${parent.nom},${parent.telephone},${parent.montantTotal},${parent.nbEleves},${parent.resteTotal}\n`;
    });
    
    // Créer et télécharger le fichier CSV
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `apee_rapport_budget_${dateStr}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Afficher une confirmation
    alert(`Rapport budgétaire exporté avec succès!\nFichier: ${fileName}`);
}




