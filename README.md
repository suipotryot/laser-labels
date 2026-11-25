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

## SVG produit

- Dimensions en millimètres (`width="60mm"`, `viewBox` en mm) : la taille réelle est conservée à l'import dans LightBurn.
- Tout est dessiné en trait (`fill="none"`, `stroke="#000"`) : le mode Line ou Fill se choisit dans le logiciel de gravure.
- L'orientation est déduite des dimensions : plus haute que large → icône au-dessus du texte, sinon icône à gauche.
