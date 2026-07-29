# Focusmith Support

Support website for the [Focusmith](https://apps.apple.com/app/focusmith) iOS app.

## Pages

| Page | URL |
|------|-----|
| **Support Home** | https://branicio.github.io/focusmith-support/ |
| **Privacy Policy** | https://branicio.github.io/focusmith-support/privacy.html |
| **Terms of Use** | https://branicio.github.io/focusmith-support/terms.html |

## Languages

Every page carries English, Brazilian Portuguese and Spanish. The **EN / PT / ES**
tabs in the header switch the whole page — one language is visible at a time.

| Language | Fragment | Section |
|---|---|---|
| English | `#top` | `<section data-lang="en">` |
| Português (Brasil) | `#portugues` | `<section data-lang="pt">` |
| Español | `#espanol` | `<section data-lang="es">` |

Still one canonical URL per document — App Store Connect takes a single privacy policy
URL — and the app deep-links a language with a fragment (`privacy.html#portugues`) from
Settings.

The choice survives navigation between pages, by two independent means:

1. An explicit tab click is remembered in `localStorage`.
2. Every internal page link is rewritten to carry the active language's fragment, so a
   copied link keeps its language and the choice holds even where storage is blocked
   (Safari private browsing, cookies disabled).

Resolution order on load is **fragment → stored choice → `navigator.language` → English**.
A fragment wins so a shared or app-supplied link always shows the language it names; a
stored choice beats the browser locale because someone who picked Português on an
English-locale machine meant it. A fragment-driven load does *not* overwrite the stored
choice — only an explicit tab click does.

### How it degrades

`styles.css` only hides a language when `<html data-js="on">` is present, and `site.js`
sets that attribute on its very first line. If the script fails to load or parse, the
attribute is never set and **all three languages render stacked** — the readable state
this design falls back to. The script's `try/catch` then *removes* the attribute if setup
fails partway, withdrawing the stylesheet's permission to hide anything.

That makes "no language visible" structurally impossible, which matters when the content
being hidden is a privacy policy.

### Editing

Pages are generated, not hand-edited. Markup supplies only `data-lang` on each section and
`role="tab"` + `data-lang-target` on each control; `site.js` stamps every ARIA attribute
(`role="tabpanel"`, ids, `aria-controls`, `aria-selected`, `aria-hidden`, roving tabindex)
at load, so the relationships cannot drift.

Shared chrome outside the language sections — nav links, footer — is translated with
`data-i18n-en` / `-pt` / `-es` attributes. The authored text is captured as the baseline,
so an element with no `data-i18n-es` falls back to English rather than keeping stale
Portuguese.

## Contact

For questions or support, email [braniapps@gmail.com](mailto:braniapps@gmail.com).
