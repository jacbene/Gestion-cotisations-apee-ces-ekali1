(function() {
  // DOM Caching
  const dateDebut = document.getElementById("date-debut");
  const dateFin = document.getElementById("date-fin");
  const pwaStatus = document.getElementById("pwa-status");
  const pwaMessage = document.getElementById("pwa-message");
  const installButton = document.getElementById("install-button");
  const paiementTab = document.getElementById("paiement");
  const budgetTab = document.getElementById("budget");
  const historiqueTab = document.getElementById("historique");
  const fileInput = document.getElementById("file-input");
  const nomParent = document.getElementById("nom-parent");
  const telephone = document.getElementById("telephone");
  const adresse = document.getElementById("adresse");
  const statutParent = document.getElementById("statut-parent");
  const detailsParent = document.getElementById("details-parent");
  const paiementDette = document.getElementById("paiement-dette");
  const nomEleve = document.getElementById("nom-eleve");
  const classe = document.getElementById("classe");
  const listeEleves = document.getElementById("liste-eleves");
  const montantTotal = document.getElementById("montant-total");
  const montantVerse = document.getElementById("montant-verse");
  const restePayer = document.getElementById("reste-payer");
  const observations = document.getElementById("observations");
  const derniersPaiements = document.getElementById("derniers-paiements");
  const objectifRecettes = document.getElementById("objectif-recettes");
  const recettesRealisees = document.getElementById("recettes-realisees");
  const tauxRealisation = document.getElementById("taux-realisation");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressText = document.getElementById("progress-text");
  const detailsMensuels = document.getElementById("details-mensuels");
  const tableauPaiements = document.getElementById("tableau-paiements");
  const recapGlobal = document.getElementById("recap-global");
  const dateRecap = document.getElementById("date-recap");
  const contenuRecap = document.getElementById("contenu-recap");

  // App State
  let eleves = [];
  let paiements = [];
  let currentParent = null;

  // Constants
  const C = {
      COTISATION_PAR_ELEVE: 12500,
      OBJECTIF_RECETTES: 1250000
  };

  // Utility Functions
  const formatCurrency = (amount) => `${amount.toLocaleString()} FCFA`;
  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');

  // Local Storage Functions
  const getFromLocalStorage = (key) => {
      try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : [];
      } catch (error) {
          console.error(`Error reading from local storage: ${key}`, error);
          return [];
      }
  };

  const saveToLocalStorage = (key, data) => {
      try {
          localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
          console.error(`Error writing to local storage: ${key}`, error);
      }
  };

  // Event Listeners
  window.addEventListener("load", () => {
      paiements = getFromLocalStorage("paiements");
      afficherPaiementsDansTableau();
      mettreAJourBudget();
      afficherDerniersPaiements();
  });

  nomParent.addEventListener("blur", verifierParent);
  telephone.addEventListener("blur", verifierParent);
  montantVerse.addEventListener("change", calculerReste);

  // Core Functions
  function verifierParent() {
      const nom = nomParent.value.trim();
      const tel = telephone.value.trim();

      if (!nom || !tel) {
          return;
      }

      currentParent = paiements.find(p => p.nomParent === nom && p.telephone === tel);

      if (currentParent) {
          statutParent.textContent = "Parent existant";
          detailsParent.innerHTML = `
              <p>Ancien solde: ${formatCurrency(currentParent.restePayer)}</p>
          `;
          paiementDette.style.display = "block";
          montantTotal.value = formatCurrency(currentParent.restePayer);
      } else {
          statutParent.textContent = "Nouveau parent";
          detailsParent.innerHTML = "";
          paiementDette.style.display = "none";
          calculerMontantTotal();
      }
  }

  function ajouterEleve() {
      const nom = nomEleve.value.trim();
      const cl = classe.value.trim();

      if (!nom || !cl) {
          alert("Veuillez remplir le nom et la classe de l'élève.");
          return;
      }

      eleves.push({ nom, cl });
      afficherEleves();
      calculerMontantTotal();
      nomEleve.value = "";
      classe.value = "";
  }

  function afficherEleves() {
      listeEleves.innerHTML = eleves.map((e, i) => `
          <div class="eleve">
              <span>${e.nom} (${e.cl})</span>
              <button onclick="supprimerEleve(${i})">x</button>
          </div>
      `).join("");
  }

  function supprimerEleve(index) {
      eleves.splice(index, 1);
      afficherEleves();
      calculerMontantTotal();
  }

  function calculerMontantTotal() {
      const total = eleves.length * C.COTISATION_PAR_ELEVE + (currentParent ? currentParent.restePayer : 0);
      montantTotal.value = formatCurrency(total);
      calculerReste();
  }

  function calculerReste() {
      const total = parseFloat(montantTotal.value.replace(/\s|FCFA/g, ""));
      const verse = parseFloat(montantVerse.value) || 0;
      const reste = total - verse;
      restePayer.value = formatCurrency(reste);
  }

  function enregistrerPaiement() {
      const nom = nomParent.value.trim();
      const tel = telephone.value.trim();
      const adr = adresse.value.trim();
      const verse = parseFloat(montantVerse.value) || 0;
      const reste = parseFloat(restePayer.value.replace(/\s|FCFA/g, ""));
      const obs = observations.value.trim();
      const date = new Date().toISOString();

      if (!nom || !tel || (eleves.length === 0 && !currentParent)) {
          alert("Veuillez remplir les informations du parent et ajouter au moins un élève.");
          return;
      }

      const paiement = {
          nomParent: nom,
          telephone: tel,
          adresse: adr,
          eleves: eleves,
          montantVerse: verse,
          restePayer: reste,
          date: date,
          observations: obs
      };

      if (currentParent) {
          const index = paiements.findIndex(p => p.nomParent === currentParent.nomParent && p.telephone === currentParent.telephone);
          paiements[index] = { ...paiements[index], ...paiement };
      } else {
          paiements.push(paiement);
      }

      saveToLocalStorage("paiements", paiements);
      alert("Paiement enregistré avec succès !");
      resetForm();
      afficherPaiementsDansTableau();
      mettreAJourBudget();
      afficherDerniersPaiements();
  }

  function resetForm() {
      nomParent.value = "";
      telephone.value = "";
      adresse.value = "";
      nomEleve.value = "";
      classe.value = "";
      montantVerse.value = "";
      observations.value = "";
      eleves = [];
      currentParent = null;
      afficherEleves();
      calculerMontantTotal();
      statutParent.textContent = "Nouveau parent";
      detailsParent.innerHTML = "";
      paiementDette.style.display = "none";
  }

  function afficherPaiementsDansTableau() {
    const tbody = tableauPaiements.querySelector("tbody");
    tbody.innerHTML = paiements.map((p, i) => `
        <tr>
            <td>${p.nomParent}</td>
            <td>${p.telephone}</td>
            <td>${p.eleves.map(e => e.nom).join(", ")}</td>
            <td>${p.eleves.map(e => e.cl).join(", ")}</td>
            <td>${formatCurrency(p.montantVerse)}</td>
            <td>${formatCurrency(p.restePayer)}</td>
            <td>${formatDate(p.date)}</td>
            <td class="no-print">
                <button onclick="supprimerPaiement(${i})">🗑️</button>
            </td>
        </tr>
    `).join("");
  }


  function supprimerPaiement(index) {
      if (confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
          paiements.splice(index, 1);
          saveToLocalStorage("paiements", paiements);
          afficherPaiementsDansTableau();
          mettreAJourBudget();
          afficherDerniersPaiements();
      }
  }

  function mettreAJourBudget() {
      const totalVerse = paiements.reduce((acc, p) => acc + p.montantVerse, 0);
      const taux = (totalVerse / C.OBJECTIF_RECETTES) * 100;

      recettesRealisees.textContent = formatCurrency(totalVerse);
      tauxRealisation.textContent = `${taux.toFixed(2)}%`;
      progressBarFill.style.width = `${taux}%`;
      progressText.textContent = `${taux.toFixed(2)}%`;
      objectifRecettes.textContent = formatCurrency(C.OBJECTIF_RECETTES);

      // Group by month
      const monthlyData = paiements.reduce((acc, p) => {
          const month = new Date(p.date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
          if (!acc[month]) {
              acc[month] = {
                  count: 0,
                  amount: 0,
                  students: 0
              };
          }
          acc[month].count++;
          acc[month].amount += p.montantVerse;
          acc[month].students += p.eleves.length;
          return acc;
      }, {});

      detailsMensuels.innerHTML = Object.entries(monthlyData).map(([month, data]) => `
          <tr>
              <td>${month}</td>
              <td>${data.count}</td>
              <td>${formatCurrency(data.amount)}</td>
              <td>${data.students}</td>
          </tr>
      `).join("");
  }

  function afficherDerniersPaiements() {
      derniersPaiements.innerHTML = paiements.slice(-5).reverse().map(p => `
          <div class="dernier-paiement">
              <p><strong>${p.nomParent}</strong> - ${formatCurrency(p.montantVerse)} - ${formatDate(p.date)}</p>
          </div>
      `).join("");
  }

  // PWA Functions
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      pwaStatus.style.display = 'block';
      pwaMessage.textContent = 'Cette application peut être installée sur votre appareil';
      installButton.style.display = 'inline-block';
  });

  installButton.addEventListener('click', () => {
      installButton.style.display = 'none';
      pwaMessage.textContent = 'Installation en cours...';
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
              pwaMessage.textContent = 'Application installée avec succès!';
          } else {
              pwaMessage.textContent = 'Installation annulée';
          }
          deferredPrompt = null;
          setTimeout(() => {
              pwaStatus.style.display = 'none';
          }, 3000);
      });
  });

  window.addEventListener('appinstalled', () => {
      console.log('Application installée avec succès');
  });

  if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Application en mode standalone');
  }

  // Global Functions (accessible from HTML)
  window.showTab = (tabName) => {
      [paiementTab, budgetTab, historiqueTab].forEach(tab => tab.classList.remove("active"));
      document.getElementById(tabName).classList.add("active");
  };

  window.ajouterEleve = ajouterEleve;
  window.supprimerEleve = supprimerEleve;
  window.enregistrerPaiement = enregistrerPaiement;
  window.supprimerPaiement = supprimerPaiement;

  window.importerPaiements = () => {
      fileInput.click();
  };

  fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const importedPaiements = JSON.parse(e.target.result);
                  if (Array.isArray(importedPaiements)) {
                      paiements = importedPaiements;
                      saveToLocalStorage("paiements", paiements);
                      afficherPaiementsDansTableau();
                      mettreAJourBudget();
                      afficherDerniersPaiements();
                      alert("Paiements importés avec succès !");
                  } else {
                      alert("Format de fichier invalide.");
                  }
              } catch (error) {
                  alert("Erreur lors de la lecture du fichier.");
              }
          };
          reader.readAsText(file);
      }
  });

    window.exporterPaiements = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paiements, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "paiements.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };


})();
