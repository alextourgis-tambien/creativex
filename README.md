# CreativeX — Webflow motion

Préproduction : https://creativex-preprod.webflow.io/

## Installation

Ajouter `webflow/header.html` à **Site settings → Custom code → Head code** et
`webflow/footer.html` au **Footer code**, après le code existant. Enregistrer puis
publier sur le sous-domaine Webflow. Ne pas supprimer les scripts de sections déjà présents.
Les fichiers sont servis via jsDelivr depuis ce dépôt public, sans build npm.

## Direction et comportements

- Hero : titres par lignes masquées (1,05 s), paragraphe progressif et CTA légèrement soulevé.
- Scroll : titres et paragraphes révélés une fois, avec décalage entre les lignes.
- Boutons `.button` / `.button-text` : soulèvement du texte de 1,5 px, en 0,4 s, au survol et au focus clavier.
- Soulignement progressif en 0,45 s sur `.nav__dropdown-wrapper`, `.navbar-link-text` et `.footer-link`
  (libellé `.footer-link-text`), sans déplacer les icônes ni changer les contrôles Webflow.
- Lenis : lissage des mouvements de molette, `lerp: 0.14`, toucher natif sur mobile.
- Pages : rideau bleu pétrole à la sortie (0,55 s), puis ouverture à l'arrivée (0,7 s).
  La navigation charge réellement la nouvelle page, avec le cycle Webflow habituel.
- Ancres internes : défilement Lenis avec décalage de 90 px et transfert du focus.
- Recalcul des lignes quand la largeur ou les polices changent via SplitText `autoSplit`.

Les grandes séquences restent à travailler ensemble. Les animations existantes des
sections `.section-observability`, `.section-bussiness` et `.images-loop-wrapper`
sont conservées et exclues des nouvelles révélations de texte.

Les `.obs-card` flottent en continu : déplacement vertical de 6 à 13 px, légère
dérive horizontale et oscillation de 0,9 degré. Chaque carte a une phase et une
durée différentes. Les trois états d'image sont déplacés ensemble dans un calque
interne ; le conteneur conserve sa trajectoire GSAP au scroll. Les boucles sont
en pause hors écran et dans un onglet masqué, et désactivées avec mouvement réduit.

La majorité des liens du site sont actuellement `href="#"` : ils gardent leur
comportement natif. Les transitions se déclenchent quand de vrais liens internes
vers d'autres pages sont renseignés. Les liens externes, téléchargements et nouveaux
onglets conservent leur comportement natif.

## Dépendances et accessibilité

GSAP / ScrollTrigger / SplitText 3.13.0 et Lenis 1.3.11. Les globals déjà présents
sont réutilisés. Ne pas ajouter une deuxième initialisation de Lenis.
Le nouveau script désactive ses animations, son lissage et ses transitions avec
`prefers-reduced-motion: reduce`, y compris lors d'un changement de préférence.
Cette option ne contrôle pas les animations de sections déjà présentes dans Webflow.
Aucune règle CSS ne masque les textes avant le chargement réussi du runtime.
Les libellés de liens ne sont pas dupliqués, les textes avec liens/contrôles ne sont
pas découpés, et les titres gardent leur nom accessible.

## Personnalisation

- `data-cx-reveal` : ajouter une révélation de texte à un élément simple.
- `data-cx-button` : ajouter le survol à un bouton contenant `.button-text`.
- `data-cx-motion="off"` : exclure un composant des nouvelles animations.
- `data-cx-transition="off"` : garder la navigation native d'un lien.
- `data-lenis-prevent` : conteneur à défilement indépendant.
- `window.CreativeX.refresh()` : préparer du contenu ajouté ou rendu visible.
- `window.CreativeX.destroy()` : restituer le DOM et libérer le runtime.
- `window.CreativeX.lenis` : instance utilisée par le script.

## Publication

Les snippets utilisent le même SHA pour CSS et JS, afin de figer une version.
À chaque livraison, remplacer ce SHA par celui du nouveau commit des assets.

## Validation

Syntaxe JavaScript : `node --check assets/creativex.js`.
Vérification navigateur sur une copie du HTML Webflow : chargement réel des
bibliothèques, titre accessible, absence de débordement à 390 px, recalcul des
lignes, refresh sans duplication, destruction avec restauration du DOM, rideau
et navigation entre deux pages de test. Fixtures : mouvement réduit et SplitText
indisponible (contenu conservé, navigation native).

Les transitions seront à vérifier sur les véritables autres pages quand leurs
liens seront renseignés.

Le 5 octobre 2026, les snippets ont été installés dans les blocs head/footer du
site et publiés sur le sous-domaine Webflow. Vérification sur la préproduction :
asset figé chargé, Lenis actif, neuf boutons préparés, révélations au scroll
actives et aucune erreur console.

## Globe du hero

`assets/world.js`, `assets/world.css` et `assets/world-land.json` dessinent un
globe à fond transparent dans `.world__wrapper`. Aucun changement de structure
Webflow nécessaire : conserver la largeur et la hauteur de cet emplacement.

Projection sphérique sur Canvas, continents clairs, routes géographiques courbes,
points circulants et panneaux blancs rattachés aux villes visibles. GSAP pilote
une rotation complète en 95 secondes. Dix villes : Londres, Paris, New York,
Mexico, São Paulo, Cape Town, Dubai, Singapour, Tokyo et Sydney. Les villes proches
sont espacées dans la sélection pour éviter des panneaux superposés.

Les campagnes et scores sont des exemples illustratifs. Ils ne proviennent pas
d'une API CreativeX et se modifient dans le tableau `cities` de `world.js`.
Les connexions se modifient dans `routes`, et la vitesse dans le tween `spin`.

Le globe s'arrête au survol sur les appareils avec pointeur, hors écran et dans
un onglet masqué. Avec mouvement réduit, il reste statique. Rendu limité à 30 fps
et densité de pixels plafonnée à 2. `window.CreativeXWorld.destroy()` libère les
animations, les observateurs et le DOM.

Contours géographiques : Natural Earth, domaine public, résolution 110m.
Source : https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
Le JSON local contient uniquement les contours arrondis à deux décimales, sans
attributs des pays. Il est chargé depuis la même version CDN que `world.js`.

Validation : syntaxe JS, rendu de la home Webflow sur desktop et à 390 px,
absence de débordement horizontal, panneaux lisibles et fixture mouvement réduit.
