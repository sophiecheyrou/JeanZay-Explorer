# Module 2.5 — Console d’administration

## Fonctions
- Tableau de bord en direct
- Classement Sportifs
- Liste et tirage au sort des Touristes éligibles
- Contrôle privé des preuves des 3 premières équipes seulement
- Suivi de toutes les équipes et des retours
- Réinitialisation totale : Sheets + photos Drive mises à la corbeille + remise à zéro automatique des téléphones

## Installation
1. Remplacez tous les fichiers GitHub par ceux du ZIP, sauf `Code.gs`.
2. Dans Apps Script, remplacez le code par le nouveau `Code.gs`.
3. Remettez vos vrais `SHEET_ID` et `DRIVE_FOLDER_ID`.
4. Exécutez `setup()` une fois.
5. Déployer > Gérer les déploiements > Modifier > Nouvelle version > Déployer.
6. L’URL `/exec` ne change pas.

## Console
- Adresse : `https://votre-site/admin.html`
- Code : `1600` (modifiable dans `config.js` ET dans `Code.gs`)

## Réinitialisation
Le bouton exige de saisir `REINITIALISER`. Il efface les lignes des onglets Equipes et Preuves, met les photos du dossier Drive à la corbeille et change l’identifiant d’édition. Les téléphones effacent leurs anciennes données lors de leur prochaine ouverture en ligne.
