# Module 2.6 — dédoublonnage et aperçu privé

## Corrections
- Une équipe est comptée une seule fois par code, même si plusieurs inscriptions identiques existent dans le Google Sheet.
- `setup()` supprime automatiquement les doublons existants dans l’onglet Equipes.
- La console affiche des miniatures privées uniquement pour les preuves des trois premières équipes Sportifs.
- Les images sont transmises à la console après vérification du code administrateur et ne sont jamais affichées dans l’application élèves.

## Installation
1. Remplacer les fichiers GitHub par ceux du dossier, sauf `Code.gs`.
2. Dans Apps Script, remplacer le code par le nouveau `Code.gs`, puis remettre les identifiants SHEET_ID et DRIVE_FOLDER_ID.
3. Exécuter `setup()` une fois : les doublons de l’onglet Equipes seront supprimés.
4. Déployer une nouvelle version de l’application Web.
5. Fermer et rouvrir la PWA / console pour charger le nouveau cache.
