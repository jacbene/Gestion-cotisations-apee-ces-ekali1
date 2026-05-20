# 📋 Gestion des Cotisations APEE CES Ekali 1

**Plateforme complète de gestion des cotisations et bilans financiers pour l'Association des Parents d'Élèves et Enseignants du CES d'Ekali 1 - MFOU**

![Version](https://img.shields.io/badge/version-2.0-brightgreen)
![Licence](https://img.shields.io/badge/licence-MIT-blue)
![Status](https://img.shields.io/badge/status-Production-success)

---

## 📖 Table des matières
- [Description](#description)
- [Fonctionnalités](#fonctionnalités)
- [Pages de l'application](#pages-de-lapplication)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Technologies](#technologies)
- [PWA (Mode Hors Ligne)](#pwa-mode-hors-ligne)
- [Contribution](#contribution)
- [Auteurs](#auteurs)
- [Licence](#licence)

---

## 📝 Description

Cette application web offre une **solution complète et intuitive** pour gérer les cotisations des parents d'élèves. Elle permet d'enregistrer les paiements, générer des bilans financiers, effectuer des recherches avancées et exporter les données en plusieurs formats.

**Caractéristiques principales :**
- ✅ Stockage local sécurisé (pas de serveur requis)
- ✅ Fonctionne hors ligne (PWA)
- ✅ Exportation en PDF/JSON
- ✅ Interface responsive (mobile/desktop)
- ✅ Données automatiquement sauvegardées

---

## 🎯 Fonctionnalités

### 💰 **Gestion des Cotisations**
- ✅ Enregistrement des paiements par parent
- ✅ Ajout dynamique de multiples élèves par parent
- ✅ Calcul automatique des montants (cotisation × nombre d'élèves)
- ✅ Gestion des acomptes et paiements partiels
- ✅ Historique complet des transactions
- ✅ Notes/observations sur les paiements

### 📊 **Bilans Financiers**
- ✅ Génération de bilans complets (PDF & JSON)
- ✅ Bilans filtrés par période
- ✅ Suivi de l'objectif financier (barre de progression)
- ✅ Statistiques mensuelles
- ✅ Répartition par parent avec soldes
- ✅ Taux de réalisation de l'objectif

### 🔍 **Recherche Avancée**
- ✅ Recherche en temps réel par nom du parent
- ✅ Recherche par nom de l'élève
- ✅ Suggestions automatiques
- ✅ Filtrage par :
  - 📅 Période (date début/fin)
  - 💵 Montant (min/max)
  - 🏫 Classe de l'élève
  - 📌 Statut de paiement (soldé, partiel, retard)
- ✅ Filtres rapides (parents en retard, paiements partiels, etc.)

### 📁 **Gestion des Données**
- ✅ Import/Export JSON
- ✅ Sauvegarde complète (backup)
- ✅ Restauration de données
- ✅ Suppression sélective de paiements
- ✅ Copie/téléchargement des informations

### 🖨️ **Impressions & Exports**
- ✅ Impression de fiches parents (détaillées)
- ✅ Impression de tableaux de suivi
- ✅ Export PDF de bilans
- ✅ Export JSON structuré
- ✅ Récapitulatif global imprimable

### ⚙️ **Paramétrage**
- ✅ Modification du nom de l'association
- ✅ Configuration de l'année scolaire
- ✅ Montant de cotisation ajustable
- ✅ Objectif financier configurable

### 📱 **PWA (Installation comme app)**
- ✅ Installation sur mobile (Android/iOS)
- ✅ Fonctionnement hors ligne
- ✅ Bannière d'installation automatique
- ✅ Service Worker pour mise en cache
- ✅ Accès rapide depuis l'écran d'accueil

---

## 📄 Pages de l'Application

### 1. **Accueil** (`index.html`)
- Dashboard principal avec 5 options de navigation
- Affichage du nom de l'association
- Bannière d'installation PWA
- Navigation vers toutes les autres pages

### 2. **Formulaire Cotisations** (`formulaire-cotisations.html`)
- 📝 Saisie des informations du parent
- ➕ Ajout dynamique d'élèves
- 💰 Enregistrement des paiements
- 📱 Envoi de SMS récapitulatif
- 📊 Aperçu des derniers paiements
- 🖨️ Impression de l'historique

### 3. **Générateur de Bilans** (`bilan-financier.html`)
- 📊 Statistiques globales (revenus, reste à payer)
- 📈 Progression vers l'objectif
- 📅 Bilans par période
- 👨‍👩‍👧‍👦 Suivi des soldes par parent
- 🖨️ Impression et export en PDF/JSON
- 📋 Récapitulatif complet

### 4. **Recherche Parent** (`recherche-parent.html`) ⭐ **NOUVEAU**
- 🔍 Recherche simple et suggestions
- ⚙️ Recherche avancée avec filtres
- ⚡ Filtres rapides (retard, solde, etc.)
- 📋 Affichage détaillé du parent
- 🖨️ Impression de fiche
- 💾 Export des données

### 5. **Gestion Financière** (`gestion-financiere.html`)
- 📋 Bons de commande
- 💳 Ordres de paiement
- 💸 Gestion des remboursements
- 💰 Suivi budgétaire

### 6. **Archives** (`archives.html`)
- 📁 Historique complet
- 🔎 Recherche de paiements anciens
- 📥 Export de l'historique
- 📊 Statistiques passées

### 7. **Paramètres** (`parametres.html`)
- ⚙️ Configuration de l'association
- 💵 Montant de cotisation
- 🎯 Objectif financier
- 💾 Gestion des sauvegardes

---

## 🚀 Installation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Edge, Safari)
- Accès à Internet (pour la première visite)
- Aucune installation système requise

### Étapes d'installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/jacbene/Gestion-cotisations-apee-ces-ekali1.git
   ```

2. **Accéder au dossier du projet :**
   ```bash
   cd Gestion-cotisations-apee-ces-ekali1
   ```

3. **Lancer un serveur local :**
   ```bash
   # Avec Python 3
   python -m http.server 8000
   
   # Ou avec Node.js (http-server)
   npx http-server
   
   # Ou avec Live Server (VS Code)
   # Clic droit sur index.html → Open with Live Server
   ```

4. **Accéder à l'application :**
   ```
   http://localhost:8000
   ```

5. **Installer comme PWA (optionnel) :**
   - Sur Chrome/Edge : Cliquer sur "Installer l'application" en bas
   - Sur iOS : Safari → Partage → Ajouter à l'écran d'accueil
   - Sur Android : Menu → Installer l'application

---

## 📖 Utilisation

### Workflow typique

#### **1. Enregistrer une cotisation**
1. Aller à "Enregistrer une cotisation"
2. Remplir les infos du parent (nom, téléphone, adresse)
3. Ajouter les élèves (nom + classe)
4. Saisir le montant versé
5. Cliquer "Enregistrer le paiement"
6. *(Optionnel)* Envoyer un SMS récapitulatif

#### **2. Générer un bilan**
1. Aller à "Générateur de bilans"
2. *(Optionnel)* Importer des données JSON
3. *(Optionnel)* Filtrer par période
4. Cliquer sur "Bilan complet PDF" ou "Bilan complet JSON"
5. Télécharger ou imprimer le document

#### **3. Rechercher un parent**
1. Aller à "Recherche Parent/Élève"
2. Taper le nom du parent OU de l'élève
3. Cliquer sur le parent dans les suggestions
4. Voir ses infos complètes + historique
5. *(Optionnel)* Imprimer sa fiche

#### **4. Utiliser les filtres avancés**
1. Aller à "Recherche Parent/Élève"
2. Cliquer sur "⚙️ Recherche avancée"
3. Filtrer par :
   - 📅 Dates (début/fin)
   - 💵 Montants (min/max)
   - 🏫 Classe
   - 📌 Statut (soldé, partiel, retard)
4. Voir les parents correspondants

#### **5. Exporter les données**
1. Aller à "Générateur de bilans"
2. Cliquer "📎 Exporter toutes les données (JSON)"
3. Le fichier se télécharge automatiquement
4. Peut être réimporté ultérieurement

---

## 🛠️ Technologies

### **Frontend**
- **HTML5** — Structure et sémantique
- **CSS3** — Design responsive et animations
- **JavaScript (vanilla)** — Logique et interactivité
- **html2pdf.js** — Génération de PDF côté client

### **Stockage**
- **localStorage** — Persistance des données
- **JSON** — Format d'export/import

### **PWA**
- **Service Worker** — Cache et mode hors ligne
- **Web App Manifest** — Installation comme app

### **Compatibilité**
- ✅ Chrome/Chromium (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Edge (v90+)
- ✅ Samsung Internet (Android)

---

## 📱 PWA (Mode Hors Ligne)

L'application fonctionne **complètement hors ligne** une fois installée !

### ✨ Fonctionnement PWA
1. **Service Worker** cache les fichiers HTML/CSS/JS
2. **localStorage** stocke les données localement
3. **Manifeste** permet l'installation comme app
4. **Bannière** invite à installer (Chrome/Edge/Android)

### 🚀 Installation sur mobile

**Android (Chrome) :**
- Une bannière apparaît automatiquement
- Cliquer "Installer maintenant"
- L'app s'ajoute à l'écran d'accueil

**iOS (Safari) :**
- Partage → "Ajouter à l'écran d'accueil"
- Nommez l'app et confirmez

**Desktop (Windows/Mac) :**
- Chrome : Menu → "Installer l'app"
- Edge : Menu → "Installer cette app"

### 📊 Avantages
- 📵 Fonctionne sans Internet
- ⚡ Charge très rapidement
- 💾 Données toujours accessibles
- 🔒 Aucun compte nécessaire
- 🎯 Accès depuis l'écran d'accueil

---

## 💡 Cas d'Usage

### **Pour un trésorier**
- ✅ Enregistrer les paiements reçus
- ✅ Générer des bilans mensuels/trimestriels
- ✅ Exporter les données pour comptabilité
- ✅ Imprimer des reçus aux parents

### **Pour un responsable**
- ✅ Visualiser l'avancement de la collecte
- ✅ Identifier les parents en retard
- ✅ Générer des rappels
- ✅ Imprimer des listes

### **Pour l'administration**
- ✅ Exporter les données en JSON
- ✅ Importer de nouvelles cotisations
- ✅ Consulter les statistiques
- ✅ Auditer les transactions

---

## 📋 Structure du Projet

```
Gestion-cotisations-apee-ces-ekali1/
├── index.html                      # Accueil principal (PWA)
├── formulaire-cotisations.html     # Saisie des cotisations
├── bilan-financier.html            # Générateur de bilans
├── recherche-parent.html           # Recherche avancée ⭐ NOUVEAU
├── gestion-financiere.html         # Gestion financière
├── archives.html                   # Archives et historique
├── parametres.html                 # Paramètres
├── manifest.json                   # PWA manifest
├── sw.js                           # Service Worker
├── public/
│   ├── index.html                  # (Old version)
│   ├── style.css                   # Styles
│   ├── script.js                   # Logique JavaScript
│   ├── api.js                      # API/Helpers
│   └── icons/                      # Icônes et favicon
├── icons/                          # Icônes PWA
└── README.md                       # Documentation

```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 🎉

### Comment contribuer ?

1. **Fork le dépôt**
2. **Créer une branche** (`git checkout -b feature/ma-fonctionnalite`)
3. **Commit les changements** (`git commit -m "Ajout de ma fonctionnalité"`)
4. **Push vers la branche** (`git push origin feature/ma-fonctionnalite`)
5. **Ouvrir une Pull Request**

### 🐛 Signaler un bug

Ouvrez une **issue** avec :
- Description du bug
- Étapes pour reproduire
- Résultat attendu
- Résultat obtenu

### 💬 Suggestions

Avez-vous des idées ? Ouvrez une **discussion** !

---

## 👤 Auteurs

- **[jacbene](https://github.com/jacbene)** — Développeur principal
- Email : jacquesbene301@gmail.com

---

## 📄 Licence

Ce projet est sous **licence MIT**.

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

Consultez [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Support

Besoin d'aide ?

- 📖 Consultez la [documentation complète](docs/)
- 🐛 Signalez un bug sur [GitHub Issues](https://github.com/jacbene/Gestion-cotisations-apee-ces-ekali1/issues)
- 💬 Posez une question en [Discussion](https://github.com/jacbene/Gestion-cotisations-apee-ces-ekali1/discussions)

---

## 🚀 Feuille de Route

### ✅ Version 2.0 (Actuelle)
- [x] Gestion complète des cotisations
- [x] Générateur de bilans PDF/JSON
- [x] Recherche avancée des parents
- [x] Support PWA (hors ligne)
- [x] Bannière d'installation
- [x] Filtres multiples

### 📅 Prochaines versions
- [ ] SMS/Email de rappel automatique
- [ ] Synchronisation cloud (optionnel)
- [ ] Interface administrateur
- [ ] Statistiques avancées
- [ ] Graphiques de progression
- [ ] Support multilingue

---

## 📊 Statistiques

- **Langage** : JavaScript 69.5% | HTML 18.7% | CSS 11.8%
- **Type** : Application Web Progressive (PWA)
- **Base de données** : localStorage (côté client)
- **Serveur requis** : Non (fonctionnement autonome)

---

## ⭐ Remerciements

Merci à tous les contributeurs et utilisateurs qui ont aidé à améliorer cette application !

---

<p align="center">
  <strong>Fait avec ❤️ pour l'APEE CES d'Ekali 1</strong>
</p>

---

**Version** : 2.0  
**Dernière mise à jour** : Mai 2026  
**Status** : ✅ Production
