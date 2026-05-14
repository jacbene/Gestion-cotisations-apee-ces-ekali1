// api.js - Gestion des données de l'APEE CES D'EKALI 1
// Utilisation de localStorage pour une PWA sans backend

// Clé unique pour le stockage local
const STORAGE_KEY = 'apee_app_data';

// Structure initiale des données
const DEFAULT_DATA = {
    parents: [],      // liste des parents/tuteurs
    paiements: [],    // historique des transactions
    nextParentId: 1,
    nextPaiementId: 1
};

// Modèle d'un parent
/*
{
    id: number,
    nom: string,
    telephone: string,
    adresse: string,
    eleves: [ { id: number, nom: string, classe: string } ],
    totalPaye: number,      // somme des montants versés par ce parent
    createdAt: string,
    updatedAt: string
}
*/

// Modèle d'un paiement
/*
{
    id: number,
    parentId: number,
    parentNom: string,
    telephone: string,
    adresse: string,
    eleves: [ { nom: string, classe: string } ],  // snapshot des élèves concernés
    montantVerse: number,
    resteApresPaiement: number,   // solde du parent après cette transaction
    observations: string,
    date: string,                  // format ISO YYYY-MM-DD
    createdAt: string
}
*/

// ----- Fonctions internes (helpers) -----

// Charger toutes les données depuis localStorage
function loadAllData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return JSON.parse(raw);
}

// Sauvegarder toutes les données
function saveAllData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Recalculer le totalPayé d'un parent à partir de ses paiements
function recalculerTotalPayeParent(parentId) {
    const data = loadAllData();
    const parent = data.parents.find(p => p.id === parentId);
    if (!parent) return 0;

    const paiementsParent = data.paiements.filter(p => p.parentId === parentId);
    const total = paiementsParent.reduce((sum, p) => sum + p.montantVerse, 0);
    parent.totalPaye = total;
    parent.updatedAt = new Date().toISOString();
    saveAllData(data);
    return total;
}

// Calculer le total dû par un parent (12500 * nb élèves)
function getTotalDuParent(parent) {
    const nbEleves = parent.eleves.length;
    return nbEleves * 12500;
}

// Obtenir le solde restant d'un parent (total dû - total payé)
function getSoldeParent(parentId) {
    const data = loadAllData();
    const parent = data.parents.find(p => p.id === parentId);
    if (!parent) return 0;
    const totalDu = getTotalDuParent(parent);
    const reste = totalDu - parent.totalPaye;
    return reste > 0 ? reste : 0;
}

// ----- Fonctions publiques exposées globalement (pour l'UI) -----

// Récupérer tous les parents (avec leurs élèves)
window.getParents = function() {
    const data = loadAllData();
    return data.parents;
};

// Récupérer un parent par son ID
window.getParentById = function(id) {
    const data = loadAllData();
    return data.parents.find(p => p.id === id);
};

// Rechercher un parent par nom et téléphone (pour éviter les doublons)
window.findParentByNomTel = function(nom, telephone) {
    const data = loadAllData();
    return data.parents.find(p => p.nom === nom && p.telephone === telephone);
};

// Ajouter ou mettre à jour un parent (et ses élèves)
// parentData : { nom, telephone, adresse, eleves: [{ nom, classe }] }
window.saveParentWithEleves = function(parentData) {
    const data = loadAllData();
    let parent = data.parents.find(p => p.nom === parentData.nom && p.telephone === parentData.telephone);
    const now = new Date().toISOString();

    if (parent) {
        // Mise à jour : ajouter les nouveaux élèves qui n'existent pas déjà (comparaison simple par nom+classe)
        const nouveauxEleves = parentData.eleves.filter(e =>
            !parent.eleves.some(pe => pe.nom === e.nom && pe.classe === e.classe)
        );
        let nextEleveId = Math.max(...parent.eleves.map(e => e.id), 0) + 1;
        nouveauxEleves.forEach(e => {
            parent.eleves.push({ id: nextEleveId++, nom: e.nom, classe: e.classe });
        });
        parent.adresse = parentData.adresse || parent.adresse;
        parent.updatedAt = now;
        // Le totalPaye ne change pas, mais on met à jour updatedAt
    } else {
        // Création d'un nouveau parent
        const newId = data.nextParentId++;
        const elevesAvecId = parentData.eleves.map((e, idx) => ({ id: idx + 1, nom: e.nom, classe: e.classe }));
        parent = {
            id: newId,
            nom: parentData.nom,
            telephone: parentData.telephone,
            adresse: parentData.adresse || '',
            eleves: elevesAvecId,
            totalPaye: 0,
            createdAt: now,
            updatedAt: now
        };
        data.parents.push(parent);
    }
    saveAllData(data);
    return parent;
};

// Enregistrer un paiement pour un parent
// Paramètres : parentId, montantVerse, observations, date (optionnelle, par défaut aujourd'hui)
window.enregistrerPaiement = function(parentId, montantVerse, observations, dateStr = null) {
    if (montantVerse <= 0) {
        alert("Le montant versé doit être supérieur à 0");
        return false;
    }

    const data = loadAllData();
    const parent = data.parents.find(p => p.id === parentId);
    if (!parent) {
        alert("Parent introuvable");
        return false;
    }

    const soldeAvant = getSoldeParent(parentId);
    if (montantVerse > soldeAvant + parent.totalPaye) {
        // On ne peut pas verser plus que le total dû (sinon remboursement ? On bloque)
        alert("Le montant versé ne peut pas dépasser le total dû par le parent.");
        return false;
    }

    // Snapshot des élèves du parent au moment du paiement
    const elevesSnapshot = parent.eleves.map(e => ({ nom: e.nom, classe: e.classe }));

    const datePaiement = dateStr ? dateStr : new Date().toISOString().slice(0,10);
    const newPaiementId = data.nextPaiementId++;
    const nouveauPaiement = {
        id: newPaiementId,
        parentId: parent.id,
        parentNom: parent.nom,
        telephone: parent.telephone,
        adresse: parent.adresse,
        eleves: elevesSnapshot,
        montantVerse: montantVerse,
        resteApresPaiement: 0, // sera recalculé après mise à jour du totalPaye
        observations: observations || '',
        date: datePaiement,
        createdAt: new Date().toISOString()
    };

    // Ajouter le paiement
    data.paiements.push(nouveauPaiement);
    saveAllData(data);

    // Recalculer le totalPaye du parent
    recalculerTotalPayeParent(parentId);
    const nouveauSolde = getSoldeParent(parentId);

    // Mettre à jour le champ resteApresPaiement dans le paiement que l'on vient d'ajouter
    const data2 = loadAllData();
    const paiementAjoute = data2.paiements.find(p => p.id === newPaiementId);
    if (paiementAjoute) {
        paiementAjoute.resteApresPaiement = nouveauSolde;
        saveAllData(data2);
    }

    return true;
};

// Récupérer tous les paiements (triés par date décroissante)
window.getAllPaiements = function() {
    const data = loadAllData();
    return [...data.paiements].sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Récupérer les paiements entre deux dates (format YYYY-MM-DD)
window.getPaiementsEntreDates = function(dateDebut, dateFin) {
    const data = loadAllData();
    if (!dateDebut && !dateFin) return data.paiements;
    const debut = dateDebut ? new Date(dateDebut) : new Date(0);
    const fin = dateFin ? new Date(dateFin) : new Date(8640000000000000);
    return data.paiements.filter(p => {
        const pDate = new Date(p.date);
        return pDate >= debut && pDate <= fin;
    });
};

// Supprimer un paiement (met à jour le totalPayé du parent et le solde)
window.supprimerPaiement = function(paiementId) {
    let data = loadAllData();
    const paiementIndex = data.paiements.findIndex(p => p.id === paiementId);
    if (paiementIndex === -1) {
        alert("Paiement introuvable");
        return false;
    }
    const paiement = data.paiements[paiementIndex];
    const parentId = paiement.parentId;

    // Retirer le paiement
    data.paiements.splice(paiementIndex, 1);
    saveAllData(data);

    // Recalculer le totalPaye du parent
    recalculerTotalPayeParent(parentId);
    return true;
};

// Exporter TOUTES les données (parents + paiements) au format JSON
window.exporterDonneesCompletes = function() {
    const data = loadAllData();
    const exportObj = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: data
    };
    const jsonStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([jsonStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apee_backup_${new Date().toISOString().slice(0,19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Importer des données depuis un fichier JSON (remplace totalité)
window.importerDonneesCompletes = function(jsonData) {
    try {
        const parsed = JSON.parse(jsonData);
        if (!parsed.data || !parsed.data.parents || !parsed.data.paiements) {
            throw new Error("Format invalide");
        }
        const nouvelleData = parsed.data;
        // Vérifier l'intégrité minimale
        if (!nouvelleData.nextParentId || !nouvelleData.nextPaiementId) {
            nouvelleData.nextParentId = (Math.max(...nouvelleData.parents.map(p => p.id), 0) + 1);
            nouvelleData.nextPaiementId = (Math.max(...nouvelleData.paiements.map(p => p.id), 0) + 1);
        }
        saveAllData(nouvelleData);
        return true;
    } catch (e) {
        console.error(e);
        alert("Erreur lors de l'import : fichier JSON invalide.");
        return false;
    }
};

// Récupérer les statistiques budgétaires (recettes réalisées, objectif global)
window.getBudgetStats = function() {
    const data = loadAllData();
    // Objectif : nombre total d'élèves * 12500
    let totalEleves = 0;
    data.parents.forEach(p => {
        totalEleves += p.eleves.length;
    });
    const objectif = totalEleves * 12500;
    const recettesRealisees = data.paiements.reduce((sum, p) => sum + p.montantVerse, 0);
    const taux = objectif > 0 ? (recettesRealisees / objectif) * 100 : 0;
    return { objectif, recettesRealisees, taux, totalEleves };
};

// Récupérer les détails des paiements par mois pour l'onglet budget
window.getPaiementsParMois = function() {
    const data = loadAllData();
    const moisMap = new Map(); // key: "YYYY-MM"
    data.paiements.forEach(p => {
        const mois = p.date.slice(0,7);
        if (!moisMap.has(mois)) {
            moisMap.set(mois, { total: 0, nb: 0, elevesSet: new Set() });
        }
        const entry = moisMap.get(mois);
        entry.total += p.montantVerse;
        entry.nb++;
        p.eleves.forEach(e => entry.elevesSet.add(e.nom));
    });
    const result = [];
    for (let [mois, val] of moisMap.entries()) {
        result.push({
            mois: mois,
            nbPaiements: val.nb,
            montant: val.total,
            nbElevesConcernes: val.elevesSet.size
        });
    }
    return result.sort((a,b) => a.mois.localeCompare(b.mois));
};

// Obtenir les 5 derniers paiements (pour l'affichage rapide)
window.getDerniersPaiements = function(limit = 5) {
    const tous = window.getAllPaiements();
    return tous.slice(0, limit);
};

// Fonction pour réinitialiser toutes les données (attention)
window.resetAllData = function() {
    if (confirm("⚠️ ATTENTION : Cette action efface TOUTES les données (parents, élèves, paiements). Êtes-vous sûr ?")) {
        saveAllData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
        alert("Données réinitialisées.");
        window.location.reload();
    }
};

// Exporter uniquement les paiements (pour l'ancienne fonction "exporterPaiements")
window.exporterPaiements = function() {
    const data = loadAllData();
    const exportPaiements = {
        type: "paiements",
        version: "1.0",
        exportDate: new Date().toISOString(),
        paiements: data.paiements,
        parents: data.parents // nécessaire pour conserver le lien
    };
    const jsonStr = JSON.stringify(exportPaiements, null, 2);
    const blob = new Blob([jsonStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apee_paiements_${new Date().toISOString().slice(0,19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Importer des paiements (fusionne les paiements importés avec les existants)
window.importerPaiements = function(jsonData) {
    try {
        const parsed = JSON.parse(jsonData);
        if (parsed.type !== 'paiements' || !parsed.paiements) {
            throw new Error("Format non reconnu");
        }
        const data = loadAllData();
        let maxPaiementId = data.nextPaiementId - 1;
        let maxParentId = data.nextParentId - 1;

        for (let p of parsed.paiements) {
            // Vérifier si le parent existe déjà (par id ou par nom+téléphone)
            let parentExistant = data.parents.find(parent => parent.id === p.parentId);
            if (!parentExistant && p.parentId) {
                parentExistant = data.parents.find(parent => parent.nom === p.parentNom && parent.telephone === p.telephone);
            }
            if (!parentExistant) {
                // Créer un nouveau parent à partir des infos du paiement
                const newParentId = ++maxParentId;
                const nouveauParent = {
                    id: newParentId,
                    nom: p.parentNom,
                    telephone: p.telephone,
                    adresse: p.adresse || '',
                    eleves: p.eleves.map((e, idx) => ({ id: idx+1, nom: e.nom, classe: e.classe })),
                    totalPaye: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                data.parents.push(nouveauParent);
                parentExistant = nouveauParent;
                p.parentId = newParentId;
            } else {
                // Mettre à jour l'adresse si besoin
                if (p.adresse && !parentExistant.adresse) parentExistant.adresse = p.adresse;
                // Fusionner les élèves manquants
                const nouveauxEleves = p.eleves.filter(e =>
                    !parentExistant.eleves.some(pe => pe.nom === e.nom && pe.classe === e.classe)
                );
                let nextId = Math.max(...parentExistant.eleves.map(e=>e.id),0)+1;
                nouveauxEleves.forEach(e => {
                    parentExistant.eleves.push({ id: nextId++, nom: e.nom, classe: e.classe });
                });
                p.parentId = parentExistant.id;
            }

            // Vérifier si le paiement existe déjà (par id original)
            const existant = data.paiements.find(ex => ex.id === p.id);
            if (!existant) {
                const newId = ++maxPaiementId;
                data.paiements.push({
                    id: newId,
                    parentId: p.parentId,
                    parentNom: p.parentNom,
                    telephone: p.telephone,
                    adresse: p.adresse,
                    eleves: p.eleves,
                    montantVerse: p.montantVerse,
                    resteApresPaiement: p.resteApresPaiement,
                    observations: p.observations,
                    date: p.date,
                    createdAt: p.createdAt || new Date().toISOString()
                });
            }
        }
        // Mettre à jour les compteurs
        data.nextParentId = maxParentId + 1;
        data.nextPaiementId = maxPaiementId + 1;
        saveAllData(data);
        // Recalculer les totaux payés pour tous les parents modifiés
        const parentsIds = new Set();
        parsed.paiements.forEach(p => {
            if (p.parentId) parentsIds.add(p.parentId);
        });
        for (let pid of parentsIds) {
            recalculerTotalPayeParent(pid);
        }
        return true;
    } catch(e) {
        console.error(e);
        alert("Erreur lors de l'import des paiements.");
        return false;
    }
};

// Sauvegarder un backup complet (alias de exporterDonneesCompletes)
window.sauvegarderBackup = function() {
    window.exporterDonneesCompletes();
};

// Récupérer le solde d'un parent (pour affichage dans l'UI)
window.getSoldeParentPublic = function(parentId) {
    return getSoldeParent(parentId);
};

// Exposer également une fonction pour obtenir tous les élèves d'un parent
window.getElevesByParentId = function(parentId) {
    const parent = window.getParentById(parentId);
    return parent ? parent.eleves : [];
};

// Initialiser les données par défaut si aucune n'existe
(function initData() {
    const data = loadAllData();
    if (data.parents.length === 0 && data.paiements.length === 0) {
        // Optionnel : ajouter des données de démonstration ?
        // Rien n'est ajouté, la base est vide.
        console.log("Base de données initialisée (vide)");
    }
})();
