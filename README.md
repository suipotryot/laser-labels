# laser-labels

Générateur d'étiquettes SVG pour la gravure laser des boîtes de rangement de quincaillerie (vis, clous, boulons, écrous, chevilles…).

Publié sur [suipotryot.github.io/laser-labels](https://suipotryot.github.io/laser-labels/).

## Développement

Application web statique en JavaScript vanilla, bundlée par Vite en un seul `dist/index.html` (`vite-plugin-singlefile`).

```bash
npm install
npx playwright install chromium   # une fois, pour les tests e2e

npm run dev        # serveur de développement
npm test           # tests unitaires (node:test)
npm run test:e2e   # tests end-to-end (Playwright, sur le build)
npm run lint       # ESLint
npm run build      # produit dist/index.html
npm run deploy     # build + copie dans ../suipotryot.github.io/laser-labels
```

## Déploiement

`npm run deploy` construit le projet puis remplace le dossier `laser-labels/` du clone voisin `../suipotryot.github.io` par le contenu de `dist/` (échec explicite si le clone ou le build est absent). Il reste ensuite à committer et pousser dans le dépôt du hub : GitHub Pages sert sa branche `main` telle quelle.

## SVG produit

- Dimensions en millimètres (`width="60mm"`, `viewBox` en mm) : la taille réelle est conservée à l'import dans LightBurn.
- Tout est dessiné en trait (`fill="none"`, `stroke="#000"`) : le mode Line ou Fill se choisit dans le logiciel de gravure.
- L'orientation est déduite des dimensions : plus haute que large → icône au-dessus du texte, sinon icône à gauche.
- Le texte est converti en contours fermés (police embarquée, aucune dépendance aux polices installées) et ajusté pour tenir dans sa zone.

## Langues

L'interface est disponible en français (par défaut) et en anglais. Le choix est mémorisé dans le navigateur (`localStorage`) et détermine aussi le nom du fichier téléchargé. Les textes sont dans `src/i18n/fr.js` et `src/i18n/en.js` : une clé ajoutée dans l'une doit l'être dans l'autre (un test le vérifie). Le SVG ne contient que la dimension saisie et la taille d'empreinte, qui ne sont pas traduites.

## Police

Le texte est gravé en [Barlow Semi Condensed](https://github.com/jpt/barlow) SemiBold, © 2017 The Barlow Project Authors, sous licence SIL Open Font License 1.1 (voir [src/text/fonts/OFL.txt](src/text/fonts/OFL.txt)).
