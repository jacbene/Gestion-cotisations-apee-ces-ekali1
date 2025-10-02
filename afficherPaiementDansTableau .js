// Fonction pour afficher un paiement dans le tableau
function afficherPaiementDansTableau(paiement) {
    // 1. Sélectionner le corps du tableau des paiements
    const tbody = document.querySelector('#tableau-paiements tbody');
    
    // 2. Créer une nouvelle ligne (tr) dans le tableau
    const newRow = tbody.insertRow();
    
    // 3. Ajouter les cellules (td) avec les données du paiement
    
    // Cellule 0: Nom du parent
    newRow.insertCell(0).textContent = paiement.nomParent;
    
    // Cellule 1: Téléphone du parent
    newRow.insertCell(1).textContent = paiement.telephone;
    
    // Cellule 2: Liste des élèves (noms séparés par des virgules)
    // Si aucun élève n'est associé (paiement de dette), afficher un message par défaut
    newRow.insertCell(2).textContent = paiement.eleves.map(e => e.nom).join(', ') || 'Aucun élève ajouté (paiement dette)';
    
    // Cellule 3: Liste des classes des élèves
    newRow.insertCell(3).textContent = paiement.eleves.map(e => e.classe).join(', ') || '-';
    
    // Cellule 4: Montant versé (formaté avec séparateurs de milliers)
    newRow.insertCell(4).textContent = `${paiement.montantVerse.toLocaleString('fr-FR')} FCFA`;
    
    // Cellule 5: Reste à payer (formaté avec séparateurs de milliers)
    newRow.insertCell(5).textContent = `${paiement.reste.toLocaleString('fr-FR')} FCFA`;
    
    // Cellule 6: Date du paiement
    newRow.insertCell(6).textContent = paiement.datePaiement;
    
    // 4. Cellule 7: Actions (boutons interactifs)
    const actionCell = newRow.insertCell(7);
    actionCell.className = 'no-print'; // Classe pour exclure de l'impression
    
    // Contenu HTML de la cellule d'actions
    actionCell.innerHTML = `
        <!-- Bouton SMS : Envoyer un SMS de rappel -->
        <button class="sms" onclick="envoyerSMS('${paiement.telephone}', '${paiement.nomParent}', ${paiement.montantVerse}, ${paiement.reste})">📱</button>
        
        <!-- Bouton Détails : Afficher les détails du paiement -->
        <button onclick="afficherDetails(this)">📋</button>
        
        <!-- Bouton Récapitulatif : Générer un récapitulatif pour ce parent -->
        <button onclick="genererRecapParent('${paiement.nomParent}')">📊</button>
        
        <!-- Bouton Supprimer : Supprimer ce paiement -->
        <button class="delete" onclick="supprimerPaiement(${paiement.id})">🗑️</button>
    `;
    
    // 5. Ajouter des styles conditionnels pour le reste à payer
    const resteCell = newRow.cells[5]; // Cellule du reste à payer
    
    // Si le reste à payer est positif, appliquer un style d'alerte (rouge)
    if (paiement.reste > 0) {
        resteCell.style.color = '#d32f2f'; // Rouge
        resteCell.style.fontWeight = 'bold';
    } else {
        // Si le paiement est complet, appliquer un style de succès (vert)
        resteCell.style.color = '#388E3C'; // Vert
        resteCell.style.fontWeight = 'bold';
    }
    
    // 6. Ajouter un effet visuel pour les nouvelles lignes
    newRow.style.animation = 'fadeIn 0.5s ease-in';
}

// Version améliorée avec gestion d'erreurs
function afficherPaiementDansTableauAmelioree(paiement) {
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

// CSS associé recommandé
/*
.actions-cell {
    display: flex;
    gap: 5px;
    justify-content: center;
}

.actions-cell button {
    padding: 5px 8px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 14px;
}

.actions-cell button.sms {
    background: #e3f2fd;
}

.actions-cell button.delete {
    background: #ffebee;
}

.reste-positive {
    color: #d32f2f;
    font-weight: bold;
}

.reste-zero {
    color: #388E3C;
    font-weight: bold;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
*/

