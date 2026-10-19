# Global custom code — 19 octobre 2026

Les overrides auparavant inline sont conservés dans assets/global-custom.css, assets/global-head.js et assets/global-footer.js. Les trois fichiers préservent les règles, scripts et ordre des callbacks existants.

Le head JS est synchrone, avant le body : il prépare le rideau de navigation et enregistre les hooks DOMContentLoaded avant Webflow. Ne pas lui ajouter defer/async. Le footer JS reste synchrone après GSAP/ScrollTrigger et avant les bundles defer existants. Les versions historiques de creativex et world restent figées.

Le bootstrap sessionStorage cx-next-page/cx-entering a été retiré : son rideau est déjà neutralisé par cx-fast-page-transitions. L’adaptateur de scroll natif est conservé car le bundle historique charge encore Lenis. Le correctif algo historique reste pour les instances qui utilisent l’ancien diagramme ; la home dispose de sa séquence V2 dans son code de page.

GTM-N4CFPQM est installé une seule fois, directement dans le head global. Les paramètres et tags du conteneur sont administrés chez Google Tag Manager. Les snippets header.html/footer.html remplacent intégralement les champs globaux correspondants, ils ne doivent pas y être ajoutés en doublon.

Les codes spécifiques aux pages (home, maps, partenaires, podcasts, captions) restent dans les pages Webflow et ne font pas partie de cette migration globale.
