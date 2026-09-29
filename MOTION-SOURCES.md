# V9 motion and visual source

The user supplied a local follow.art static mirror and a separate `replica/` reconstruction. This preview uses the reconstruction directly as its design foundation and replaces the reference site's content with Ji_Feng's own. The source site is [follow.art](https://follow.art/). The prior V6 motion studies remain in Git history but are not loaded by V9.

| File in this repository | Supplied source | Adaptation |
| --- | --- | --- |
| `follow/tokens.css` | `follow-art/replica/tokens.css` | Direct copy: palette, type faces, scale and component tokens. |
| `follow/motion.css` | `follow-art/replica/motion.css` | Direct copy: overlapping sticky sections, title/footer reveals, five-beat loading shapes and small interactive accents. |
| `follow/motion.js` | `follow-art/replica/motion.js` | Direct copy with three small changes: the loader reveals only the opening scene/header, starts once the page structure is ready rather than waiting for every image, and diagonal drift peaks during a section crossing then settles to zero on its own face. Its `initLayerDrift`, `initReveals`, `initUnderlines` and `initLoadingScreen` functions drive V9. |
| `fonts/Hardbop-Bold.woff2`, `fonts/HeadingNow-73Book.woff2` | Supplied local font files | Self-hosted under the website owner's confirmed Web license. License proof is not published. |
| `index.html`, `follow-blog.css`, `follow-blog.js` | New blog adaptation | Personal section composition, responsive behavior, chapter/route transitions, language toggle, article archive and full reading routes. V8 changed the final non-sticky section from the replica's two-row grid to block layout, removing an empty second viewport. V9 adds authored imagery and an asymmetric Work composition while preserving the reference motion language. |

The source mirror's Follow.art logo, member cards, photographer portraits, signup/login logic and backend APIs are not present. Home cards use Ji_Feng's existing planet art and editorial text. The five loader shapes are CSS geometry, not original site SVGs.

The independent preview retains native wheel/touch scrolling, keyboard-accessible links and controls, mobile menu navigation, and reduced-motion behavior. A standalone article route is available as `#/reading/{slug}`; Chinese original article bodies and source hashes are in `reading-data.js`.
