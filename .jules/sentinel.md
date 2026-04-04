## 2026-03-24 - [Stored XSS in Profile Rendering]
**Vulnerability:** User-provided profile fields (name, avatar, color) were injected directly into `innerHTML` strings in `js/index.js` (e.g., in `renderParentsCorner` and `openDashboard`), and raw strings were interpolated into inline `onclick` handlers. Because profile data can be synced across devices via the CloudSync VPS, this was a stored XSS vulnerability.
**Learning:** Even in a client-side-only app without an authentication backend, data synced via a central server (`CloudSync`) can act as a vector for stored XSS on secondary devices (like a parent's dashboard). Also, injecting strings into inline `onclick` handlers (e.g., `onclick="addKidBonus('${p.name}', 15)"`) is brittle and breaks if the name contains quotes.
**Prevention:** Always use `escHtml` (which was updated to also escape single and double quotes) when interpolating user data into `innerHTML`. For inline event handlers, pass an index (e.g., `getProfiles()[${i}].name`) to resolve the value at runtime instead of injecting raw strings into the HTML attribute.

## 2024-05-20 - XSS Vulnerability in cssText and inline styles via user input
**Vulnerability:** Found unescaped user profile properties (like `user.color`) being injected directly into inline styles and `cssText`. Although not as easy to exploit as `innerHTML`, if not validated, a user could escape the CSS context and inject a malicious payload.
**Learning:** Even when inputs are mostly visually styled, injecting unescaped values from `localStorage` into any part of the DOM directly creates a security risk. In this case, `p.color` was sanitized when added to `innerHTML` but not when added to `style.cssText` or inline `<div style="border: ${user.color}...">`.
**Prevention:** Consistently use the existing `escHtml()` sanitization function or proper validation (e.g. enforcing hex format) for all user-controlled inputs before injecting them into the DOM, even for seemingly harmless properties like colors.
## 2026-03-24 - [CSS Injection via user.color in cssText and inline styles]
**Vulnerability:** User-provided profile fields, specifically `p.color`, were being injected directly into `style.cssText` or inline `style="..."` attributes without proper CSS context sanitization, allowing for potential CSS injection attacks, especially since data can be synced across devices.
**Learning:** Even if data is visually styled or assumed to be just a hex code, directly injecting values from `localStorage` into `style` attributes or `cssText` without validation creates a vulnerability. `escHtml` is not sufficient for CSS contexts.
**Prevention:** Always validate or sanitize color inputs before DOM injection using a strict format checker like `safeColor(c)` which enforces a valid hex code pattern and falls back to a default safe color.

## 2026-10-27 - [Stored XSS in Art Studio Gallery]
**Vulnerability:** User-provided artwork titles (`art.title`) were injected directly into `innerHTML` strings in `js/art-studio.js` when rendering the gallery (`renderGallery()`). Because artwork metadata is stored in user profiles which can be synced via CloudSync, this represented a stored XSS vulnerability.
**Learning:** Any user-generated string input, even if localized to a specific app module like Art Studio, can be a stored XSS vector if rendered directly into the DOM, especially given the CloudSync synchronization capability.
**Prevention:** Consistently apply `escHtml()` to sanitize all user-controlled inputs (such as artwork titles) before interpolating them into HTML strings used for DOM manipulation.

## 2026-04-03 - [XSS Anti-Pattern in Lab Explorer Journal]
**Vulnerability:** In `js/lab-explorer.js`, the `_addJournalEntry` function assigned string arguments directly into `innerHTML` (e.g. `div.innerHTML = \`📓 \${text} ...\``) without sanitization. While current arguments originated from hardcoded experiment data, this created an active anti-pattern and latent vulnerability.
**Learning:** Functions that generate UI elements from string parameters and manipulate `innerHTML` are prime vectors for stored/reflected XSS if the underlying data flow ever changes to include user input (e.g. custom user-generated experiments synced across devices).
**Prevention:** Consistently apply `escHtml()` (or an equivalent sanitization routine) on string parameters before injecting them into `innerHTML`, even if the string is currently assumed to be hardcoded, implementing defense-in-depth security.

## 2024-04-04 - [Stored XSS in Custom Chores]
**Vulnerability:** User-provided custom chore labels (`c.label`) were injected directly into `innerHTML` strings in `js/index.js` when rendering the chores list (`renderChoresList()`). Because custom chores are saved in `localStorage` (`zs_chores_list`) and can be modified directly or potentially synced, this represented a stored XSS vulnerability.
**Learning:** Any user-generated string input that gets persisted and later displayed must be sanitized before being added to the DOM. This applies to seemingly harmless features like custom chores.
**Prevention:** Consistently apply `escHtml()` to sanitize all user-controlled inputs before interpolating them into HTML strings used for `innerHTML` manipulation.
