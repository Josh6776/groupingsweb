# groupingsweb

Marketing website for the **Groupings** iOS app — a daily word grouping puzzle.
Static HTML/CSS/JS, bilingual (English + 日本語).

## Structure

```
.
├── index.html            # English home
├── terms.html            # Terms & Conditions (EN)
├── privacy.html          # Privacy Policy (EN)
├── contact.html          # Contact (EN)
├── ja/                   # Japanese versions of every page
│   ├── index.html
│   ├── terms.html
│   ├── privacy.html
│   └── contact.html
└── assets/
    ├── css/style.css     # all styling (light + dark theme)
    ├── js/main.js        # mobile nav
    └── img/              # app icon, App Store badge, screenshots
```

## Local preview

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## To do before launch

- Replace the App Store placeholder link `idXXXXXXXXXX` with the real App ID.
- Add the custom domain (CNAME file) once DNS is pointed.
- Have a native speaker review the Japanese legal pages.

## Deployment

Static site — host on GitHub Pages, Netlify, or Cloudflare Pages.
