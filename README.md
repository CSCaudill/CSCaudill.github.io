# cscaudill.github.io

Personal site for Chris Caudill, served by GitHub Pages at https://cscaudill.github.io/.

Plain HTML, CSS, and a few lines of JavaScript. No build step and no dependencies.

## Structure

- `index.html`: the whole site, one page with anchored sections
- `assets/css/site.css`: styles; colors and type sizes are CSS variables at the top
- `assets/js/site.js`: mobile menu, header border on scroll, current-section highlight in the nav
- `assets/fonts/`: self-hosted Archivo and Source Serif 4 (SIL Open Font License)
- `assets/img/`: portrait, social preview image, touch icon
- `404.html`: not-found page

## Editing

- **Text:** edit `index.html` directly. Each section is a `<section>` with an `id` that matches the nav link.
- **Add a project:** copy one `<article class="project">` block under Selected work.
- **Add a link (LinkedIn, résumé PDF):** add an `<li>` to `.contact__links`, and add the URL to `sameAs` in the JSON-LD block in `<head>`.
- **Contour map in the hero:** inline SVG generated from a synthetic terrain. Line colors come from `--contour` and `--contour-strong` in the CSS.
- **Motion:** add `data-reveal` to any element to have it fade up when scrolled into view. Timing tokens (`--dur-*`, `--ease-*`) are in the Motion block of `site.css`. Everything respects the reduced-motion setting, and content stays visible if JavaScript is off.

## Preview locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.
