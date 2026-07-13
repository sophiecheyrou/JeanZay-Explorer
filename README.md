# Jean Zay Explorer — Module 2

## Fonctions
- Accueil élèves avec règles complètes.
- Barème automatique : proche 10 pts, intermédiaire 20 pts, éloigné 30 pts.
- Série Sportifs : classement automatique par points.
- Série Touristes : éligibilité au tirage au sort après retour et au moins 3 lieux validés.
- Validation automatique à l'envoi d'une photo.
- Contrôle ciblé dans `admin.html`, sans miniature ni galerie publique.
- Photos conservées uniquement dans le dossier Google Drive privé.
- Signalement du retour au Grand Salon.

## Étape indispensable : mettre à jour Apps Script
1. Ouvrir le projet Apps Script déjà créé.
2. Remplacer le contenu de `Code.gs` par celui fourni dans ce dossier.
3. Renseigner vos valeurs `SHEET_ID` et `DRIVE_FOLDER_ID` en haut du fichier.
4. Exécuter `setup()` une fois.
5. Déployer > Gérer les déploiements > Modifier > Nouvelle version > Déployer.
6. Conserver la même URL `/exec` déjà intégrée dans `config.js`.

## GitHub
Remplacer tous les fichiers du dépôt de test par ceux du dossier, sauf `Code.gs` qui va uniquement dans Apps Script.

## Poste de pilotage
Adresse : `.../admin.html`
Code : `1600`

## RGPD
Les photos ne sont jamais affichées dans l'application élève, le classement ou le tableau de pilotage. Le poste de pilotage fournit uniquement un lien vers le fichier privé Drive pour un contrôle ciblé. Aucun service d'IA externe n'est appelé.
