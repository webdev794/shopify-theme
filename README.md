<h1 align="center" style="position: relative;">
  <br>
    <img src="./assets/shoppy-x-ray.svg" alt="logo" width="200">
  <br>
  Shopify Skeleton Theme
</h1>

A minimal, carefully structured Shopify theme designed to help you quickly get started. Designed with modularity, maintainability, and Shopify's best practices in mind.

<p align="center">
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
  <a href="./actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Shopify/skeleton-theme/actions/workflows/ci.yml/badge.svg"></a>
</p>

## Getting started

### Prerequisites

Before starting, ensure you have the latest Shopify CLI installed:

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) – helps you download, upload, preview themes, and streamline your workflows

If you use VS Code:

- [Shopify Liquid VS Code Extension](https://shopify.dev/docs/storefronts/themes/tools/shopify-liquid-vscode) – provides syntax highlighting, linting, inline documentation, and auto-completion specifically designed for Liquid templates

### Clone

Clone this repository using Git or Shopify CLI:

```bash
git clone git@github.com:Shopify/skeleton-theme.git
# or
shopify theme init
```

### Preview

Preview this theme using Shopify CLI:

```bash
shopify theme dev
```

## Theme architecture

```bash
.
├── assets          # Stores static assets (CSS, JS, images, fonts, etc.)
├── blocks          # Reusable, nestable, customizable UI components
├── config          # Global theme settings and customization options
├── layout          # Top-level wrappers for pages (layout templates)
├── locales         # Translation files for theme internationalization
├── sections        # Modular full-width page components
├── snippets        # Reusable Liquid code or HTML fragments
└── templates       # Templates combining sections to define page structures
```

To learn more, refer to the [theme architecture documentation](https://shopify.dev/docs/storefronts/themes/architecture).

### Templates

[Templates](https://shopify.dev/docs/storefronts/themes/architecture/templates#template-types) control what's rendered on each type of page in a theme.

The Skeleton Theme scaffolds [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) to make it easy for merchants to customize their store.

None of the template types are required, and not all of them are included in the Skeleton Theme. Refer to the [template types reference](https://shopify.dev/docs/storefronts/themes/architecture/templates#template-types) for a full list.

### Sections

[Sections](https://shopify.dev/docs/storefronts/themes/architecture/sections) are Liquid files that allow you to create reusable modules of content that can be customized by merchants. They can also include blocks which allow merchants to add, remove, and reorder content within a section.

Sections are made customizable by including a `{% schema %}` in the body. For more information, refer to the [section schema documentation](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema).

### Blocks

[Blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks) let developers create flexible layouts by breaking down sections into smaller, reusable pieces of Liquid. Each block has its own set of settings, and can be added, removed, and reordered within a section.

Blocks are made customizable by including a `{% schema %}` in the body. For more information, refer to the [block schema documentation](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/schema).

## Schemas

When developing components defined by schema settings, we recommend these guidelines to simplify your code:

- **Single property settings**: For settings that correspond to a single CSS property, use CSS variables:

  ```liquid
  <div class="collection" style="--gap: {{ block.settings.gap }}px">
    ...
  </div>

  {% stylesheet %}
    .collection {
      gap: var(--gap);
    }
  {% endstylesheet %}

  {% schema %}
  {
    "settings": [{
      "type": "range",
      "label": "gap",
      "id": "gap",
      "min": 0,
      "max": 100,
      "unit": "px",
      "default": 0,
    }]
  }
  {% endschema %}
  ```

- **Multiple property settings**: For settings that control multiple CSS properties, use CSS classes:

  ```liquid
  <div class="collection {{ block.settings.layout }}">
    ...
  </div>

  {% stylesheet %}
    .collection--full-width {
      /* multiple styles */
    }
    .collection--narrow {
      /* multiple styles */
    }
  {% endstylesheet %}

  {% schema %}
  {
    "settings": [{
      "type": "select",
      "id": "layout",
      "label": "layout",
      "values": [
        { "value": "collection--full-width", "label": "t:options.full" },
        { "value": "collection--narrow", "label": "t:options.narrow" }
      ]
    }]
  }
  {% endschema %}
  ```

## CSS & JavaScript

For CSS and JavaScript, we recommend using the [`{% stylesheet %}`](https://shopify.dev/docs/api/liquid/tags#stylesheet) and [`{% javascript %}`](https://shopify.dev/docs/api/liquid/tags/javascript) tags. They can be included multiple times, but the code will only appear once.

### `critical.css`

The Skeleton Theme explicitly separates essential CSS necessary for every page into a dedicated `critical.css` file.

## Contributing

We're excited for your contributions to the Skeleton Theme! This repository aims to remain as lean, lightweight, and fundamental as possible, and we kindly ask your contributions to align with this intention.

Visit our [CONTRIBUTING.md](./CONTRIBUTING.md) for a detailed overview of our process, guidelines, and recommendations.

## License

Skeleton Theme is open-sourced under the [MIT](./LICENSE.md) License.

## Section list: 
 
Wavy marquee
 
Vertical carousel
 
Trending products
 
Text with icon 
 
Testimonals
 
Sticky media cards
 
Social media gallery
 
Slideshow with marquee
 
Shop the kit
 
Scrolling text
 
Scrolling media cards
 
Scrollable marquee
 
Scrollable Collection
 
Scroll Slides
 
Products grid
 
Pairing Products
 
Multicolumn
 
Mix & match pack
 
Media with text overlay
 
Media with text
 
Media with cards
 
Media grid
 
Map
 
Lookbook
 
Images with text carousel
 
Images comparison
 
Highlight Text with Images
 
Hero Carousel
 
Featured products
 
Featured collections tabs
 
Detailed contact form
 
Collection with products
 
Collection tabs
 
Collection carousel
 
Burst effects
 
Blog posts
 
Best selling products
 
Custom Liquid
 
Newsletter
 
Collapsible content
 
Rich text
 
Collection list
 
Featured product

Featured collection

## Pending features 

1 Faceted search filtering — required on collection and search pages (price, availability, vendor, variant). Not present at all; only basic sorting exists.
2 Unit pricing — required on product, collection, cart, and customer pages. Not implemented anywhere.
3 Product swatches — variant picker uses plain text/radio buttons; Theme Store requires visual swatches via swatch.color/swatch.image.
4 Accelerated checkout buttons on Cart page — you have it on product page; cart page has none.
5 Selling plans (subscriptions) — required on cart and customer pages. Not present.
6 Shop Pay Installments — required on product page. Not present.
7 Pickup availability — required on product page. Not present.
8 Real product recommendations — required via Shopify's actual recommendations object/API on product pages. pairing-products.liquid is merchant-curated, not the automated recommendation feature — doesn't satisfy this.
9 Follow on Shop button (login_button filter) — not present.
--done above--
10 App block support (@app) in main-product and featured-product sections — not present; you have concrete block types only.
11 Customer account pages — never reviewed; likely missing entirely.
12 Color system — only 2 color settings (background/foreground) in settings_schema.json; requirement is minimum 4, each background paired with a foreground.
13 Favicon setting — not present in settings_schema.json.
14 Placeholder social URLs (.../#) — explicitly against the "must be left empty" / no-fake-content rule; needs fixing before any submission regardless.
15 SEO structured data (Google rich product snippets / JSON-LD) — meta-tags.liquid never reviewed, can't confirm this exists.
16 page.contact.json — required template; currently doesn't exist properly (we established you have no Contact page set up).