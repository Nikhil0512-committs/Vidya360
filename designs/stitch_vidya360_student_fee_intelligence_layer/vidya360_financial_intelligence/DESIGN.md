---
name: Vidya360 Financial Intelligence
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#1c0048'
  on-tertiary: '#ffffff'
  tertiary-container: '#35007b'
  on-tertiary-container: '#a375ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered to project **Institutional Trust** and **Operational Clarity**. As a fintech platform for educational institutions, it must balance the gravity of financial management with the forward-thinking nature of AI-driven insights.

The aesthetic follows a **Modern Professional** direction, drawing inspiration from high-end treasury dashboards. It prioritizes data density without sacrificing legibility, utilizing a "Content-First" approach where the UI recedes to let financial metrics and academic trends take center stage. 

**Key Principles:**
- **Precision:** Every pixel serves a functional purpose.
- **Translucency:** Subtle use of depth to organize complex information hierarchies.
- **Stability:** A grounded color palette that evokes the permanence of an educational institution.

## Colors

The palette is anchored by **Slate Indigo** (#1E293B) to establish authority and trust. **Growth Teal** (#0D9488) is used strategically for primary actions and "success" states, symbolizing financial health.

- **Primary (Slate Indigo):** Navigation, primary headers, and deep-background components.
- **Secondary (Teal):** Call-to-actions, positive trends, and completed payment statuses.
- **Insights (Amethyst):** Reserved specifically for AI-generated suggestions and academic data overlays.
- **Warning (Amber):** High-visibility indicator for late fees, risk alerts, or pending approvals.
- **Background:** A layered approach using #FFFFFF for primary content surfaces and #F8FAFC for the underlying canvas to reduce eye strain during prolonged sessions.

## Typography

This design system utilizes a dual-font approach. **Plus Jakarta Sans** provides a modern, slightly geometric character for headlines, making the platform feel contemporary. **Inter** is used for all functional body text and data displays due to its exceptional legibility at small sizes and high x-height.

**Usage Notes:**
- Use `mono-data` for all currency values and numerical tables to ensure alignment.
- Maintain tight letter-spacing on larger headlines to preserve the "premium" feel.
- Semi-bold (600) is the default for titles to ensure a clear visual break from body copy.

## Layout & Spacing

The layout employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. We use an 8px base unit (linear scale) to ensure consistent rhythm across all components.

- **Dashboard Layout:** Utilizes a fixed left-side navigation (280px) with a fluid content area.
- **Data Density:** In complex tables, vertical padding is reduced to 12px (1.5 units) to allow more rows to be visible above the fold.
- **Sectioning:** Large content blocks should be separated by 32px or 48px to prevent visual clutter in data-heavy environments.

## Elevation & Depth

To maintain a "Professional" feel, depth is created through **Tonal Layering** and **Subtle Outlines** rather than heavy shadows.

- **Level 0 (Canvas):** #F8FAFC. The base background.
- **Level 1 (Cards):** #FFFFFF. White surfaces with a 1px border of #E2E8F0. 
- **Level 2 (Dropdowns/Modals):** #FFFFFF with a soft, diffused shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.05)).
- **Interactive States:** Hovering over a card should increase the border-color to #CBD5E1 rather than increasing shadow depth, keeping the UI "flat-modern."

## Shapes

The shape language is **Refined and Rounded**. A consistent 8px (0.5rem) radius is applied to cards, buttons, and input fields. This softens the "industrial" feel of a finance app, making it feel more accessible for school administrators.

- **Standard (8px):** Primary containers and cards.
- **Buttons (8px):** Consistency with containers.
- **Badges/Chips (Pill-shaped):** Fully rounded to distinguish status indicators from clickable buttons.

## Components

### Buttons
- **Primary:** Filled Teal (#0D9488) with white text. High contrast, 8px radius.
- **Secondary:** Ghost style. Transparent background with a Slate Indigo border.
- **Tertiary:** Text-only with an icon for subtle utility actions.

### Cards & Data Visualization
- **Insight Cards:** Use a left-accent border of Amethyst (#7C3AED) to denote AI-driven content.
- **Sparklines:** Minimalist, no-axis line charts in Teal (positive) or Red (negative) to show 30-day fee collection trends.
- **Progress Rings:** Used for "Fee Collection Percentage." Use a thick stroke with a light gray track.

### Inputs & Tables
- **Fields:** 1px border, labels always positioned above the field in `label-md`. Focus state uses a 2px Teal ring.
- **Tables:** No vertical lines. Horizontal dividers only (1px, #F1F5F9). Row hover state uses #F8FAFC.

### Status Badges
- **Paid:** Light Teal background with Dark Teal text.
- **Overdue:** Light Red background with Dark Red text.
- **Pending:** Light Amber background with Dark Amber text.
- *Note: All badges use a `600` font weight for maximum readability against light backgrounds.*