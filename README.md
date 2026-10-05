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
- Boutons `.button` / `.button-text` : remplissage circulaire depuis le point d’entrée
  du pointeur, ouverture GSAP en 0,7 s avec `back.out(1.5)`, fermeture en 0,45 s
  vers le point de sortie. Le diamètre couvre le coin opposé même depuis un bord.
  Bleu clair sur fond bleu, bleu pétrole sur fond blanc ou corail ; le texte reste fixe.
  Le focus clavier ouvre le fond depuis le centre ; les interactions tactiles restent natives.
- `.nav__dropdown-wrapper`, `.navbar-link-text` et `.footer-link` : révélation verticale
  lettre par lettre au survol et au focus clavier, sur deux rangées superposées.
  Durée de 0,55 s par lettre, décalage total plafonné à 0,14 s, courbe `power3.inOut`,
  retour fluide en sens inverse. Les icônes restent fixes et le masque laisse de la marge
  aux accents et descendantes.
- Logos CMS `.logo-wrapper` / `.logos-list` / `.logos-item` : ruban GSAP sans coupure,
  34 px/s sur desktop et 24 px/s sur mobile, accélération douce liée à la vitesse de scroll.
  Défilement continu au survol, arrêt progressif au focus clavier, reprise amortie,
  entrée décalée et bords estompés.
  Copies décoratives `aria-hidden` et `inert`, largeur recalculée après chargement des images
  et redimensionnement ; pause hors écran ou onglet masqué. Mouvement réduit : liste native.
- Résultats `.bussines-cards` : apparition des contenus internes à `top 92%`,
  opacité et déplacement de 20 px sur 0,85 s, décalage de 0,09 s entre logo,
  texte et chiffres (ou photo, citation et signature). Léger décalage entre colonnes.
  Une seule apparition, sans modifier le parallaxe des `.bussines-cards-vertical`.
- CTA `.cta-wrapper-right > .card` : quatre trajectoires de parallaxe distinctes
  avec déplacement horizontal discret, montée de 38 à 74 px et petite rotation
  ajoutée aux angles Webflow. ScrollTrigger de `top bottom` à `bottom top`, `scrub: 1.1`.
  Amplitude à 55 % sur mobile, retour naturel à la remontée ; chaque instance du CTA
  possède sa propre animation, sans toucher aux autres `.card` du site.
- Lenis : lissage des mouvements de molette, `lerp: 0.14`, toucher natif sur mobile.
- Pages : rideau bleu pétrole à la sortie (0,55 s), puis ouverture à l'arrivée (0,7 s).
  La navigation charge réellement la nouvelle page, avec le cycle Webflow habituel.
- Ancres internes : défilement Lenis avec décalage de 90 px et transfert du focus.
- Recalcul des lignes quand la largeur ou les polices changent via SplitText `autoSplit`.

Les grandes séquences restent à travailler ensemble. Les animations existantes des
sections `.section-observability` et `.section-bussiness` sont conservées.
La section `.images-loop-wrapper` utilise désormais le radial marquee ci-dessous ;
les trois séquences restent exclues des révélations de texte globales.

Les `.obs-card` apparaissent une fois à l'entrée dans la vue : échelle de 82 %
à 100 %, fondu et léger rebond sur 0,95 seconde. Le flottement démarre ensuite.
Elles flottent en continu : déplacement vertical de 6 à 13 px, légère
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
La seconde rangée visuelle des liens est masquée aux lecteurs d’écran (`aria-hidden`),
la première conserve son nom accessible via SplitText. Les textes avec liens/contrôles
ne sont pas découpés, et les titres gardent leur nom accessible.

## Personnalisation

- `data-cx-reveal` : ajouter une révélation de texte à un élément simple.
- `data-cx-button` : ajouter le remplissage directionnel à un bouton contenant `.button-text`.
- `data-cx-marquee-speed` : vitesse de base du ruban en pixels/seconde.
- `data-cx-hover-bg` / `data-cx-hover-color` : personnaliser le fond et le texte du bouton au survol.
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

## Radial cards au scroll

`.images-loop-wrapper` / `.images-loop-track` : les `.card` suivent un arc circulaire
avec une rotation tangente. GSAP ScrollTrigger anime leur position de `top bottom`
à `bottom top`, avec `scrub: 0.9` : défilement à gauche en descendant, retour en
remontant, arrêt quand le scroll se stabilise. La jonction des copies se fait hors
champ. La hauteur reste celle d’une rangée de cartes : l’arc est coupé sur les bords
du cadre, sans agrandir la section. Les mesures se recalculent sur mobile et au resize.
Les copies sont décoratives (`aria-hidden`, `inert`). Mouvement réduit : rangée native.
L’ancien script inline home ciblant `.loop-card` et sa CSS ont été remplacés par
ce module ; les cartes réelles portent la classe `.card`.

## Dernière ligne des titres

Les titres `.title--1`, `.title--3`, `.title--2`, `.title-main`, `.highligts__title`,
`.text-55-serif-medium`, `.case__title-main`, `.nl__title`, `.contact__title` et
`.report-highligts__title` reçoivent `.span__greed` sur leur dernière ligne visuelle,
uniquement quand SplitText détecte plusieurs lignes. Recalcul automatique au resize
et au chargement des polices. Les spans déjà stylés dans Webflow sont conservés ;
les titres imbriqués ne sont pas découpés une seconde fois. Ce traitement typographique
reste actif avec mouvement réduit, sans animation, Lenis ni transition.

## Aperçu des catégories

Dans `.category-wrapper`, le survol ou le focus d’une `.cat__wrapper` affiche
la photo `.image-3` de son item CMS dans `.category-image-1`. Le second visuel
`.category-image-2` conserve l’image commune du panneau ; un second visuel placé
dans l’item CMS sera utilisé en priorité. Les autres `.category-text` passent à
35 % d’opacité et seule la `.category-arrow` active apparaît. Les images entrent
avec un fondu, 24 px de déplacement et un léger scale, décalées de 80 ms.
À la sortie, les images et flèches disparaissent et les titres retrouvent leur
opacité. Le focus clavier et le toucher déclenchent aussi l’aperçu ; le mouvement
réduit conserve l’interaction sans animation. Les liens gardent leur navigation.
