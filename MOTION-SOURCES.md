# Motion study 04

V5 adds original chapter composition on top of this motion study: a pinned opening with an overlapping journal sheet, previous/next chapter navigation, scroll-triggered reading entrances and a three-note technical folio. The folio is pinned only at widths above 800px and heights of at least 800px; smaller viewports keep direct tab controls. Native wheel and touch scrolling remain available.

This independent preview uses Ji_Feng's own writing and collection. The four supplied local reference projects inform its motion. This is an adaptation, not a complete copy of those sites.

| Reference | Source inspected | Use in this preview |
| --- | --- | --- |
| [AVA SRG](https://srg.ava-digital.site/en) | `ava-srg/rebuild/js/animations.js`, preloader module; `hand-orchestration.js` | Media readiness plus a minimum presentation duration, exponential counter, vertical progress line, upward exit; pixel-to-clear 3D reveal. Native browser animations replace its GSAP integration. Duration is shortened for a personal blog. |
| [GoodFella](https://good-fella.com/) | `good-fella/exports/recovered/DigitRoller.tsx` | Port of the em-sized vertical digit stacks and right-to-left stagger. The recovered fragment's target exceeded its stack; this version includes three full 0–9 cycles. The orange marker also appears in navigation and project transitions. |
| [Nfinite](https://nfinitepaper.com/) | `nfinite-rebuild/src/shaders.js`, `particles.js` | Reuses the simplex noise function and adapts noise-dependent start times, position/target interpolation, midpoint displacement and idle drift. New blog-specific ribbon/sheet geometry, projection, lighting colors and responsive point counts. 52,000 desktop points; 18,000 on an initial mobile load. |
| [Bürocratik 18](https://18.burocratik.com/) | `burocratik-18/exports/formatted/Bz3iEhlF.js` and `qw2CLYtA.js` | Reimplements internal asset parallax within a horizontal journey and staggered title entrances. A continuous track and an isolated image-trail area retain its directional idea. |

The three-sheet page transition is a new composition for this blog, using the shared accent and route palette. The metallic ribbon is original parametric geometry; it is not AVA's glove. The particle shapes are generated locally, not copied from Nfinite's position textures. No reference site's framework bundle or brand assets are shipped.

`particles.js` includes Ashima's simplex function. Its MIT notice is retained in `LICENSE-noise.txt`. Self-hosted font notices are in `fonts/OFL-*.txt`.

Motion pauses offscreen and when the document is hidden. Reduced-motion mode removes the intro, transition sheets, text choreography and horizontal scroll conversion; navigation and all content remain available.

EN / 中 switches the interface and saves the choice locally. Original Chinese article excerpts remain in their original language. The new Chinese interface uses independent type scales and self-hosted Noto Serif SC / Noto Sans SC subsets.
