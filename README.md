# Citesmith

English | [日本語](README-ja.md)

A Chrome (MV3) extension that adds a Citesmith button to article pages on arXiv (abstract pages), Nature, Springer (link.springer.com), Wiley Online Library and ScienceDirect. One click saves the PDF under a filename built from your template and copies the BibTeX to the clipboard.

## Install and settings

1. Clone the repository, open `chrome://extensions` and turn on Developer mode.
2. Click "Load unpacked" and choose the repository root.
3. Reload a supported article page and press the Citesmith button next to the PDF link. If no place is found, the button sits at the bottom right. The ▾ on the right of the button runs a one-off choice: "PDF + BibTeX", "PDF only" or "BibTeX only".

In the extension popup you set the display language (English or 日本語; English by default), the filename and citation key templates, the download subfolder, and whether the button downloads the PDF and/or copies the BibTeX (both on by default). Reload the extension and the article page after changing settings.

- Default filename: `${firstAuthorLastNameCaps}${year}-${titleSnakeCase}` (`.pdf` is added)
- Default citation key: `${firstAuthorLastNameLower}${year}${titleFirstWord}` (e.g. `harris2020array`, `vaswani2017attention`)
- Download subfolder: a folder inside Chrome's download folder (e.g. `papers/${journal}`). Empty means the download folder itself. Chrome does not let extensions save outside the download folder.

## Placeholders

The popup links to a reference page (`help.html`) that lists every placeholder with an example value.

Write a placeholder as `${name}`. Values come from the page's `citation_*` meta tags; ScienceDirect authors come from its BibTeX. Missing values become empty strings. An unknown name is an error.

| Name | Value |
| --- | --- |
| `author` | All authors joined with ` and ` |
| `firstAuthorFullName` | First author's name |
| `firstAuthorFirstName` / `firstAuthorLastName` | First author's given names (including middle names) / family name |
| `firstAuthorInitials` | Initials of the given and family names (upper case) |
| `firstAuthorFirstNameCaps` / `firstAuthorLastNameCaps` | Given / family name in upper case |
| `firstAuthorLastNameLower` | Family name in lower case |
| `firstAuthorFullNameCaps` | Given and family names in upper case |
| `firstAuthorFullNameCapsSnake` / `firstAuthorFullNameCapsKebab` | The above with spaces replaced by `_` / `-` |
| `year` | Publication year (arXiv: year of the first version) |
| `title` | Title |
| `titleSnakeCase` / `titleKebabCase` | Title with spaces replaced by `_` / `-` (case kept) |
| `titleCamelCase` | Title in lowerCamelCase |
| `titleFirstWord` | First ASCII word of the title, skipping common English words such as articles and prepositions (accents removed, lower case) |
| `doi` / `journal` | DOI / journal name |
| `volume` / `number` / `pages` | Volume / issue / page range (separated by `--`) |
| `publisher` / `booktitle` / `organization` | Publisher / conference name / organization |
| `url` | Article page URL |

Filenames drop characters that operating systems forbid and control characters, collapse spaces, and are limited to 180 UTF-8 bytes before the extension. Citation keys drop accents and keep only letters, digits and `_ : . -`. An empty result becomes `paper`. Chrome numbers duplicate files.

BibTeX comes from each site's own export. Citesmith changes only the citation key, protects capitals in the title (words such as `{NumPy}` and `{DNA}`), sets arXiv's `year` to the first version, and trims surrounding whitespace. "Done" on the button means the enabled actions finished (for the PDF, the download started); check Chrome's downloads page for the transfer itself. Hover over "Error" to see the reason.

## Development

Node.js 24. No npm dependencies and no build step.

```sh
npm test
node scripts/probe.mjs https://arxiv.org/abs/1706.03762
node scripts/probe.mjs https://www.nature.com/articles/s41586-020-2649-2
node scripts/e2e.mjs https://arxiv.org/abs/1706.03762 https://www.nature.com/articles/s41586-020-2649-2
```

`src/sites/` holds the per-site adapters and `src/template.js` the shared template code.

- probe: fetches the page and the BibTeX from Node and prints the resulting filename and BibTeX.
- e2e: loads the extension into a throwaway Chrome profile (headless), presses the button and checks the label, the clipboard and the saved file. Files go to `~/tmp/citesmith-e2e/`. Set `HEADFUL=1` to show the window.

Supported paths: Springer `/article/<DOI>`; Wiley `/doi/<DOI>`, `/doi/full/<DOI>` and `/doi/abs/<DOI>` (not the PDF viewer pages); ScienceDirect `/science/article/pii/<PII>` and `/science/article/abs/pii/<PII>`. ScienceDirect's BibTeX is fetched even when copying is off, because the authors come from it.
