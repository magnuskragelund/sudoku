# Sudoku Face Off - Web Design Specifications

## Overview
This document provides comprehensive design specifications for updating sudokufaceoff.com to match the look and feel of the mobile app. The design system is inspired by classic newspaper typography and layout principles, creating an elegant, timeless aesthetic.

---

## Design Philosophy

### Core Principles
- **Newspaper-Inspired Typography**: Serif fonts for headings, elegant body fonts
- **Clean, Minimal Layout**: Generous whitespace, clear hierarchy
- **Timeless Elegance**: Classic design that doesn't feel dated
- **Accessibility First**: High contrast, readable fonts, clear interactions
- **Dark Mode Support**: Full support for light and dark themes

### Visual Identity
- **Brand Name**: "THE SUDOKU TIMES"
- **Established**: "EST. 2025"
- **Tagline**: "THE DAILY PUZZLE"

---

## Typography System

### Font Families

#### Serif Font (Headings)
- **Font**: Playfair Display (Regular weight: 400)
- **Usage**: Main titles, card headings, feature headings
- **Web Font**: `'Playfair Display', serif`

#### Body Font (Content)
- **Font**: EB Garamond (Regular weight: 400)
- **Usage**: Body text, labels, descriptions, buttons
- **Web Font**: `'EB Garamond', serif`

### Font Size Scale

| Name | Size (px) | Usage |
|------|-----------|-------|
| `text8xl` | 77px | Main page title (e.g., "Sudoku") |
| `text5xl` | 38px | Feature headings, section titles |
| `text3xl` | 24px | Card headings |
| `text2xl` | 19px | Section headings |
| `textXl` | 16px | Large body text |
| `textLg` | 18px | Body large |
| `textBase` | 16px | Standard body text |
| `textSm` | 14px | Labels, buttons, small text |
| `textXs` | 12px | Small labels, metadata |

### Letter Spacing (Tracking)

| Name | Value | Usage |
|------|-------|-------|
| `trackingWide` | 0.3em | EST. 2025 labels, uppercase labels |
| `trackingNormal` | 0.2em | Standard labels, buttons |
| `trackingMedium` | 0.15em | Medium tracking |
| `trackingTight` | -0.025em | Large titles (text8xl, text5xl) |

### Line Heights

| Name | Value | Usage |
|------|-------|-------|
| `leadingTight` | 1.1 | Large headings |
| `leadingNormal` | 1.5 | Standard body text |
| `leadingRelaxed` | 1.625 | Descriptive text, long-form content |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Subtle emphasis |
| Regular | 400 | Default body text |
| Medium | 500 | Medium emphasis |
| SemiBold | 600 | Button text, labels |
| Bold | 700 | Strong emphasis |

### Typography Examples

```css
/* Main Title */
.main-title {
  font-family: 'Playfair Display', serif;
  font-size: 77px;
  font-weight: 400;
  letter-spacing: -0.025em; /* trackingTight */
  line-height: 1.1; /* leadingTight */
}

/* Uppercase Label */
.uppercase-label {
  font-family: 'EB Garamond', serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.3em; /* trackingWide */
  text-transform: uppercase;
}

/* Body Text */
.body-text {
  font-family: 'EB Garamond', serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5; /* leadingNormal */
}

/* Button Text */
.button-text {
  font-family: 'EB Garamond', serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2em; /* trackingNormal */
  text-transform: uppercase;
}
```

---

## Color System

### Light Mode Colors

#### Backgrounds
```css
--background: #F9FAFB;              /* Page background */
--background-elevated: #FFFFFF;    /* Cards, elevated surfaces */
--background-secondary: #F3F4F6;   /* Secondary areas */
--background-gradient-from: #F9FAFB;
--background-gradient-to: #FFFFFF;
```

#### Text Colors
```css
--text-primary: #000000;            /* Main text */
--text-secondary: #4a5565;         /* Secondary text */
--text-tertiary: #6B7280;         /* Tertiary text */
--text-label: #99a1af;            /* Uppercase labels */
--text-subtitle: #6a7282;         /* Subtitles */
```

#### Newspaper Grays
```css
--gray-light: #99a1af;             /* Light labels */
--gray-medium: #6a7282;           /* Subtitles */
--gray-dark: #4a5565;             /* Body text */
```

#### Borders
```css
--border-thin: #E5E7EB;            /* Thin borders */
--border-thick: #6B7280;           /* Thick borders (grid) */
--border: #D1D5DC;                 /* Standard borders */
--divider: #000000;                /* Decorative dividers */
```

#### Accent Colors
```css
--primary: #2D3748;                /* Primary accent (dark gray) */
--primary-dark: #1A202C;          /* Darker variant for gradients */
--error: #FB2C36;                 /* Error states */
--success: #22C55E;               /* Success states */
--warning: #FF8C00;               /* Warning states */
```

#### UI Elements
```css
--button-background: #F9FAFB;
--button-background-secondary: #F3F4F6;
--button-background-disabled: #F0F0F0;
--button-background-dark: #2D3748;
--button-background-dark-from: #2D3748;
--button-background-dark-to: #1A202C;
--input-background: #FFFFFF;
--card-background: #FFFFFF;
--card-border: #E5E7EB;
--card-shadow: rgba(0, 0, 0, 0.1);
--modal-background: #FFFFFF;
```

#### Sudoku Cell Colors
```css
--cell-selected: #BEDBFF;          /* Selected cell */
--cell-highlight: #F9FAFB;         /* Highlighted row/column/box */
--cell-same-value: #BEDBFF;        /* Same value highlighting */
--cell-initial: #E0E7F1;           /* Initial clue background */
--cell-correct: #E8F5E9;           /* Correctly filled */
```

### Dark Mode Colors

#### Backgrounds
```css
--background: #0A0A0A;
--background-elevated: #1A1A1A;
--background-secondary: #2A2A2A;
--background-gradient-from: #0A0A0A;
--background-gradient-to: #1A1A1A;
```

#### Text Colors
```css
--text-primary: #FFFFFF;
--text-secondary: #C4C9D1;
--text-tertiary: #9CA3AF;
--text-label: #808896;
--text-subtitle: #9CA3AF;
```

#### Newspaper Grays (Dark Mode Adjusted)
```css
--gray-light: #808896;
--gray-medium: #9CA3AF;
--gray-dark: #C4C9D1;
```

#### Borders
```css
--border-thin: #2A2A2A;
--border-thick: #404040;
--border: #404040;
--divider: #404040;
```

#### Accent Colors
```css
--primary: #C4C9D1;                /* Light gray for dark mode */
--primary-dark: #9CA3AF;
--error: #FB2C36;
--success: #22C55E;
--warning: #FF8C00;
```

#### UI Elements
```css
--button-background: #2A2A2A;
--button-background-secondary: #3A3A3A;
--button-background-disabled: #222222;
--button-background-dark: #C4C9D1;
--button-background-dark-from: #C4C9D1;
--button-background-dark-to: #9CA3AF;
--input-background: #1A1A1A;
--card-background: #1A1A1A;
--card-border: #2A2A2A;
--card-shadow: rgba(255, 255, 255, 0.05);
--modal-background: #1A1A1A;
```

#### Sudoku Cell Colors (Dark Mode)
```css
--cell-selected: #2A3A4A;
--cell-highlight: #1A1A1A;
--cell-same-value: #2A3A4A;
--cell-initial: #2D3748;
--cell-correct: #1F4529;
```

### Color Usage Guidelines

1. **Primary Text**: Use `--text-primary` for main content
2. **Secondary Text**: Use `--text-secondary` for descriptions, metadata
3. **Labels**: Use `--text-label` with uppercase and wide letter spacing
4. **Buttons**: 
   - Primary buttons: `--primary` background with white text (light mode) or `--text-primary` (dark mode)
   - Secondary buttons: `--button-background` with `--text-secondary`
5. **Cards**: `--card-background` with `--card-border` and subtle shadow
6. **Dividers**: Use `--divider` for decorative horizontal lines

---

## Spacing System

### Spacing Scale

| Name | Value (px) | Usage |
|------|------------|-------|
| `xs` | 4px | Tight spacing, icon padding |
| `sm` | 8px | Small gaps, compact spacing |
| `md` | 12px | Medium spacing |
| `lg` | 16px | Standard spacing, padding |
| `xl` | 24px | Large spacing, section gaps |
| `xl2` | 32px | Extra large spacing |
| `xl3` | 48px | Section separators |
| `xl4` | 64px | Major section breaks |

### Spacing Usage Examples

```css
/* Card Padding */
.card {
  padding: 32px; /* xl2 */
}

/* Section Margin */
.section {
  margin-bottom: 48px; /* xl3 */
}

/* Button Padding */
.button {
  padding: 16px 24px; /* lg xl */
}

/* Compact Spacing */
.compact {
  gap: 8px; /* sm */
}
```

---

## Component Specifications

### 1. Cards

#### Featured Card (Large)
- **Background**: `--card-background`
- **Border**: 1px solid `--card-border`
- **Border Radius**: 16px
- **Padding**: 32px
- **Shadow**: 
  - Offset: `0px 10px`
  - Blur: `15px`
  - Opacity: `0.1`
  - Color: `--card-shadow`

#### Standard Card (Small)
- **Background**: `--card-background`
- **Border**: 1px solid `--card-border`
- **Border Radius**: 16px
- **Padding**: 24px
- **Shadow**: Same as featured card

#### Card Structure
```
┌─────────────────────────────┐
│ LABEL (uppercase, xs, label) │
│                              │
│ Title (serif, 3xl, primary)  │
│                              │
│ Description (body, lg,      │
│ secondary)                   │
│                              │
│ [Icon Container]             │
└─────────────────────────────┘
```

### 2. Buttons

#### Primary Button
- **Background**: `--primary`
- **Text Color**: White (light mode) or `--text-primary` (dark mode)
- **Font**: EB Garamond, 14px, SemiBold (600)
- **Letter Spacing**: 0.2em
- **Text Transform**: Uppercase
- **Padding**: 16px vertical, 24px horizontal
- **Border Radius**: 12px
- **Width**: 100% (in containers)

#### Secondary Button
- **Background**: `--button-background`
- **Text Color**: `--text-secondary`
- **Font**: Same as primary
- **Padding**: 14px vertical, 24px horizontal
- **Border Radius**: 12px

#### Dark Button (Gradient)
- **Background**: Linear gradient from `--button-background-dark-from` to `--button-background-dark-to`
- **Text Color**: White (light mode) or `--text-primary` (dark mode)
- **Font**: Same as primary
- **Border Radius**: 16px
- **Shadow**: Same as cards

#### Disabled Button
- **Background**: `--button-background-disabled`
- **Text Color**: `--text-tertiary`
- **Opacity**: 0.5

### 3. Icon Buttons

- **Size**: 32px × 32px
- **Background**: `--button-background`
- **Border Radius**: 4px
- **Icon Size**: 14px or 16px
- **Icon Color**: `--text-secondary`
- **Padding**: Centered icon

### 4. Modals

#### Modal Container
- **Background**: `--modal-background`
- **Border**: 1px solid `--card-border`
- **Border Radius**: 16px
- **Padding**: 32px
- **Width**: 
  - Mobile: 90% (min 280px, max 400px)
  - Desktop: Max 400px
- **Shadow**: 
  - Offset: `0px 20px`
  - Blur: `25px`
  - Opacity: `0.15`

#### Modal Overlay
- **Background**: Blur overlay with tint
- **Tint**: Dark (light mode) or Light (dark mode)
- **Blur Intensity**: 40

#### Modal Title
- **Font**: Playfair Display, 24px (text3xl), Regular (400)
- **Color**: `--text-primary`
- **Text Align**: Center
- **Margin Bottom**: 12px (sm)

#### Modal Subtitle
- **Font**: EB Garamond, 16px (textBase), Regular (400)
- **Color**: `--text-secondary`
- **Text Align**: Center
- **Margin Bottom**: 24px (xl)

### 5. Dividers

#### Decorative Divider
- **Width**: 96px
- **Height**: 1px
- **Background**: `--divider`
- **Centered**: Yes
- **Margin**: Top and bottom spacing as needed

### 6. Masthead (Page Header)

#### Structure
```
┌─────────────────────────────┐
│ EST. 2025 (xs, label, wide) │
│                              │
│     SUDOKU (8xl, serif)      │
│                              │
│ ──────────────── (divider)   │
│                              │
│ THE DAILY PUZZLE (sm,        │
│ subtitle, normal)            │
└─────────────────────────────┘
```

### 7. Screen Header (Sub-pages)

#### Back Button
- **Text**: "RETURN TO MENU"
- **Font**: EB Garamond, 14px, Regular
- **Letter Spacing**: 0.2em
- **Text Transform**: Uppercase
- **Color**: `--text-primary`
- **Icon**: ChevronLeft, 16px
- **Layout**: Flex row, icon + text

#### Masthead (Same as main page, but with custom label)

### 8. Number Pad

#### Number Button
- **Size**: Flex 1, Height 48px
- **Background**: `--card-background`
- **Border**: 1px solid `--border-thin`
- **Border Radius**: 8px
- **Margin**: 3px horizontal
- **Shadow**: Subtle (offset 0px 2px, blur 4px, opacity 0.06)
- **Font**: Playfair Display, 26px, Regular (400)
- **Color**: `--text-primary`

#### Selected/Highlighted Number Button
- **Background**: `--primary`
- **Border**: 2px solid `--primary`
- **Text Color**: White (light mode) or `--text-primary` (dark mode)

#### Note Mode Indicator
- **Position**: Floating above number pad
- **Background**: `--primary`
- **Padding**: 6px vertical, 16px horizontal
- **Border Radius**: 8px
- **Text**: "NOTE MODE" (uppercase, sm, semiBold)
- **Shadow**: Subtle

### 9. Sudoku Board

#### Board Container
- **Background**: `--card-background`
- **Border**: 2px solid `--border-thick`
- **Aspect Ratio**: 1:1 (square)
- **Shadow**: Subtle (offset 0px 4px, blur 12px, opacity 0.08)

#### Cell
- **Size**: 11.11% width (1/9), aspect ratio 1:1
- **Border**: 
  - Thin borders: 0.5px solid `--border-thin` (between cells)
  - Thick borders: 2px solid `--border-thick` (3x3 box separators)
- **Font**: Playfair Display
- **Font Size**: 
  - Mobile: 28px
  - Tablet/Desktop: 36px
- **Font Weight**: Regular (400)
- **Color**: `--text-primary`

#### Cell States
- **Selected**: Background `--cell-selected`
- **Highlighted** (row/column/box): Background `--cell-highlight`
- **Same Value**: Background `--cell-same-value`
- **Initial Clue**: Background `--cell-initial`
- **Correctly Filled**: Background `--cell-correct`
- **Wrong Entry**: Red overlay flash animation

#### Notes (Small Numbers)
- **Font**: EB Garamond, 12px, Medium (500)
- **Color**: `--text-tertiary`
- **Layout**: 3x3 grid (1-5 top row, 6-9 bottom row)
- **Opacity**: 0 for missing notes, 1 for present notes

### 10. Stats Bar

#### Layout
- **Background**: `--background-secondary`
- **Border**: Bottom 1px solid `--border-thin`
- **Padding**: 12px vertical, 24px horizontal
- **Layout**: Flex row, space-between

#### Stat Item
- **Icon Size**: 14px
- **Icon Color**: `--text-secondary` (or specific color for hearts)
- **Text Font**: EB Garamond, 14px
- **Text Color**: `--text-secondary`
- **Layout**: Flex row, icon + text

### 11. Hint Panel

#### Panel Container
- **Background**: `--modal-background`
- **Border**: 1px solid `--card-border`
- **Border Radius**: 12px
- **Padding**: 16px
- **Margin**: 16px horizontal, 12px bottom
- **Shadow**: Subtle

#### Panel Header
- **Layout**: Flex row, space-between
- **Title**: Playfair Display, 18px, SemiBold (600)
- **Close Button**: 28px × 28px circle, `--button-background`

#### Panel Content
- **Explanation**: EB Garamond, 14px, `--text-secondary`
- **Guidance**: EB Garamond, 16px, `--text-primary`
- **Cell Info**: EB Garamond, 14px, italic, `--text-secondary`

---

## Layout Patterns

### Page Structure

#### Main Container
- **Max Width**: 
  - Mobile: 600px
  - Tablet/Desktop: 1000px
- **Padding**: 24px horizontal, 48px vertical
- **Background**: Gradient from `--background-gradient-from` to `--background-gradient-to`

#### Content Wrapper
- **Width**: 100%
- **Align Self**: Center
- **Padding**: Responsive (24px mobile, more on desktop)

### Grid System

#### Two-Column Layout
- **Container**: Flex row, gap 12px
- **Cards**: Flex 1 (equal width)
- **Breakpoint**: Stacks vertically on mobile (< 400px width)

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  /* Single column, compact spacing */
}

/* Tablet */
@media (min-width: 768px) {
  /* Two columns, larger spacing */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Full layout, max widths applied */
}
```

---

## Animation & Transitions

### Button Interactions
- **Active Opacity**: 0.7 (on press/tap)
- **Transition**: Smooth opacity change

### Modal Animations
- **Type**: Fade in/out
- **Duration**: ~300ms

### Error Flash
- **Duration**: 150ms total (50ms fade in, 100ms fade out)
- **Opacity**: 0 to 0.3 (red overlay)

### Loading States
- **Spinner**: Standard activity indicator
- **Text**: Fade in animation with opacity

---

## Accessibility Guidelines

### Color Contrast
- **Text on Background**: Minimum 4.5:1 ratio
- **Large Text**: Minimum 3:1 ratio
- **Interactive Elements**: Clear focus states

### Typography
- **Minimum Font Size**: 12px (for labels only)
- **Body Text**: 16px minimum
- **Line Height**: Minimum 1.5 for readability

### Interactive Elements
- **Touch Target Size**: Minimum 44px × 44px
- **Focus States**: Visible outline (2px solid `--primary`)
- **Keyboard Navigation**: Full support

### Screen Readers
- **Alt Text**: All icons and images
- **ARIA Labels**: For interactive elements
- **Semantic HTML**: Proper heading hierarchy

---

## Implementation Notes

### CSS Variables Setup

```css
:root {
  /* Light mode colors */
  --background: #F9FAFB;
  --text-primary: #000000;
  /* ... all light mode colors ... */
}

[data-theme="dark"] {
  /* Dark mode colors */
  --background: #0A0A0A;
  --text-primary: #FFFFFF;
  /* ... all dark mode colors ... */
}
```

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&family=EB+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Theme Toggle

- Support system preference detection
- Allow manual toggle between light/dark
- Persist preference in localStorage
- Apply theme class to `<html>` or `<body>` element

### Responsive Images

- Use appropriate image sizes for different breakpoints
- Lazy load images below the fold
- Optimize for web (WebP format preferred)

---

## Example Components

### Welcome Screen Masthead

```html
<div class="masthead">
  <p class="established-label">EST. 2025</p>
  <h1 class="main-title">Sudoku</h1>
  <div class="divider"></div>
  <p class="subtitle">THE DAILY PUZZLE</p>
</div>
```

### Featured Card

```html
<article class="featured-card">
  <div class="card-header">
    <div class="card-text">
      <p class="card-label">FEATURED</p>
      <h2 class="card-title">Single Player</h2>
    </div>
    <div class="card-icon">
      <!-- Icon SVG -->
    </div>
  </div>
  <p class="card-description">
    Challenge yourself with our curated selection of puzzles...
  </p>
</article>
```

### Primary Button

```html
<button class="button button-primary">
  START GAME
</button>
```

---

## Quality Checklist

Before launch, ensure:

- [ ] All typography matches specifications exactly
- [ ] Color system implemented with CSS variables
- [ ] Dark mode fully functional
- [ ] Responsive breakpoints working correctly
- [ ] All interactive elements have hover/focus states
- [ ] Animations are smooth and performant
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Cross-browser compatibility tested
- [ ] Mobile touch targets are adequate size
- [ ] Loading states implemented
- [ ] Error states styled correctly
- [ ] Print stylesheet (if needed)

---

## Resources

### Fonts
- **Playfair Display**: [Google Fonts](https://fonts.google.com/specimen/Playfair+Display)
- **EB Garamond**: [Google Fonts](https://fonts.google.com/specimen/EB+Garamond)

### Icons
- Use Lucide icons (or equivalent) with stroke width 1.5
- Standard sizes: 14px, 16px, 18px, 20px, 28px, 40px

### Color Tools
- Use color contrast checkers for accessibility
- Test dark mode colors for readability

---

## Contact & Questions

For questions about these specifications, refer to the mobile app implementation or contact the design team.

**Last Updated**: 2025
