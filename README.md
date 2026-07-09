# Suvara — Beauty & Cosmetics Shopify Theme

Shopify Online Store 2.0 theme, built on Shopify's Skeleton starter theme.

## Local development

```bash
shopify theme dev --store=caresort-store.myshopify.com
```

## Package for submission / distribution

```bash
shopify theme package
```

## Architecture notes
- JSON templates in `templates/` drive every page, including the homepage (`templates/index.json`) — sections are added/removed/reordered entirely through the theme editor. There is **no hardcoded section list anywhere in `layout/theme.liquid`.**
- `sections/header-group.json` / `footer-group.json` are section groups, rendered via `{% sections %}`.
- Reusable content blocks live in `blocks/` (`group.liquid`, `text.liquid`) and are referenced from sections via `"type": "@theme"`.
- The generic `<slider-component>` custom element (`assets/global.js`) plus `.slider` / `.slider-button` / `.slider-counter` classes (`assets/component-slider.css`) is the shared carousel engine — reuse this for any new section needing a slider rather than building a new one.
- `snippets/card-product.liquid` is the shared product card — reuse it in any new product-grid section.

## Changelog (recent)
- **Fixed:** removed a hardcoded homepage section list in `layout/theme.liquid` that was bypassing `templates/index.json` entirely on the homepage. Homepage now goes through the standard JSON-template flow like every other page.
- **Removed:** `sections/index-custom.liquid` (abandoned earlier draft of the same hardcoded-homepage approach, unused), `sections/hello-world.liquid` and `assets/shoppy-x-ray.svg` (Skeleton starter demo content), stray `FETCH_HEAD`/`git` files.
- **Fixed:** `snippets/css-variables.liquid` referenced `settings.background_color`, `settings.foreground_color`, and `settings.input_corner_radius`, none of which existed in `config/settings_schema.json` — added them under a new "Global colors" group and to the Layout group.
- **Fixed:** `templates/page.about.json` was hiding the page `<h1>` via an injected raw CSS rule (`custom_css`); replaced with a proper `show_title` setting on `sections/page.liquid`.
- **Added sections:** Collapsible Content, Custom Liquid, Testimonials, Text with Icon, Media with Text Overlay, Best Selling Products.

## Still open / needs team decision
- Multiple color/typography presets for Theme Store submission (currently one preset)
- Full accessibility + Lighthouse pass
- Real demo content/photography before any submission
