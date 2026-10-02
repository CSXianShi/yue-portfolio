# Reference display assets

Fan-page visual reference requested by the site owner: https://landonorris.com/.
These are publicly served display assets, not an assertion of ownership or official affiliation.
The original site is designed by OFF+BRAND. Interaction code in `helmet.js` is independently written.

- Model: https://lando.itsoffbrand.io/gl/models/helmet-21.glb
- Gold texture: https://lando.itsoffbrand.io/gl/textures/helmet/webp/gold/Norris_Helmet_mat_BaseColor.webp
- Normal texture: https://lando.itsoffbrand.io/gl/textures/helmet/webp/Norris_Helmet_mat_Normal.webp
- Visor textures: https://lando.itsoffbrand.io/gl/textures/glass/webp/Norris_Glass_mat_BaseColor.webp (and Roughness / Metallic)
- Studio environment: https://lando.itsoffbrand.io/gl/hdri/studio_small_08_1k--light.hdr
- Original static reference: https://cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/67d18655b032045a4dc78e53_ln4-hp-lando-helmet.webp

Rendering uses Three.js 0.180.0 (MIT; `../vendor/three/LICENSE`) and Draco 1.5.7 (Apache 2.0).
All required assets are self-hosted. No official-site script, analytics, cookies, or account APIs are embedded.

The static `fallback.png` is a transparent render of the same model and textures; the original reference photograph is not shipped.

## User-requested original first-screen interaction (2026-10-02)

Reference: https://landonorris.com/ and public bundle https://lando.itsoffbrand.io/dev-js/lando.OFF+BRAND.gold-android-fix-03.js . The original first screen uses a fluid-velocity cursor mask to compose the Lando portrait and a helmet render; it is not an orbit/drag-to-spin interface.

`reference-fluid-shaders.js` retains the bundle's AI, qY, qO, DO, XO, tN, IO, KO shader bodies, extracted without alteration. `fluid-cursor.js` is a standalone Three.js adapter of p9/m9 (BFECC advection, external force, divergence, four Poisson iterations, pressure projection and velocity output; original .014 dt/.96 dissipation/50 force/18 cursor defaults). `helmet.js` adapts O9's cursor threshold and curved reveal composition to the existing independent V2 stage. It does not run the complete official site bundle, analytics, CMS, navigation or audio.

Portrait inputs: https://lando.itsoffbrand.io/gl/textures/head/webp/diffuse.webp and https://lando.itsoffbrand.io/gl/textures/head/webp/alpha.webp (original 2048px WebP, self-hosted here). Public reference assets belong to their original creators; no claim of creating these source assets or shaders. The stage/layout remains the personal site's V2; this is a scoped port, not a pixel-identical copy of the full official page.
