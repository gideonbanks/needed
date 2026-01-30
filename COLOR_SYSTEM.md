# Color System - Needed.co.nz

This document establishes the consistent color system used throughout the application. All colors should use theme tokens - no hardcoded hex values.

## Brand Colors

### Primary Color (Dark Teal)
- **Token**: `$primary7`
- **Hex**: `#184153`
- **Usage**: Primary brand color, buttons, links, selected states
- **Scale**: `$primary1` (lightest) to `$primary12` (darkest)

### Accent Color (Bright Teal)
- **Token**: `$accent6`
- **Hex**: `#01a493`
- **Usage**: Accent buttons, highlights, focus states, checkmarks
- **Scale**: `$accent1` (lightest) to `$accent12` (darkest)

## Grey Scale

All greys are capped at `$gray9` (#1f1f1f) - no grey should be darker.

- **$gray1**: `#fafafa` - Lightest grey
- **$gray2**: `#f5f5f5` - Grey 100 (card hover in light theme)
- **$gray3**: `#eeeeee` - Light grey
- **$gray4**: `#e0e0e0` - Light grey (secondary text in dark theme)
- **$gray5**: `#bdbdbd` - Medium grey
- **$gray6**: `#9e9e9e` - Medium grey (secondary text in dark theme)
- **$gray7**: `#757575` - Medium-dark grey
- **$gray8**: `#616161` - Dark grey (secondary text in light theme)
- **$gray9**: `#1f1f1f` - Darkest grey (primary text in light theme, no grey darker)

## Theme Colors

### Light Theme
- **Background**: `$background` - White
- **Card Background**: `$backgroundStrong` - `#ffffff` (white)
- **Card Hover**: `$backgroundHover` - `#f5f5f5` (grey 100)
- **Border**: `$borderColor` - `#e5e5e5`
- **Primary Text**: `$color` / `$gray9` - `#1f1f1f`
- **Secondary Text**: `$colorSecondary` / `$gray8` - `#616161`

### Dark Theme
- **Background**: `$background` - `#1f1f1f`
- **Card Background**: `$backgroundStrong` - `#2a2a2a` (swapped - lighter)
- **Card Hover**: `$backgroundHover` - `#184153` (primary brand color)
- **Border**: `$borderColor` - `#333742`
- **Primary Text**: `$color` - `#e8e9ea`
- **Secondary Text**: `$colorSecondary` / `$gray6` - `#9e9e9e`

## Usage Guidelines

### Text Colors
- **Primary Text**: Use `$color` (theme-aware)
- **Secondary Text**: Use `$colorSecondary` (subtitles, footers)
- **Titles**: Use `$color` or `$gray9` in light theme
- **Accent Text**: Use `$accent6` for selected/highlighted text

### Background Colors
- **Page Background**: `$background`
- **Card/Surface Background**: `$backgroundStrong`
- **Card Hover**: `$backgroundHover`
- **Card Press**: `$backgroundPress`

### Border Colors
- **Default Border**: `$borderColor`
- **Hover Border**: `$borderColorHover`
- **Accent Border**: `$accent6` (for selected states)

### Special Cases
- **Checkmark Icons**: `$accent6` background, `white` icon
- **White Text**: Use `white` token (Tamagui's built-in white color, equivalent to `#ffffff`) - not a custom token, but Tamagui's default white color name
- **Accent Backgrounds**: Use `$accent2` for light backgrounds

## Rules

1. **NO hardcoded hex colors** - Always use theme tokens
2. **NO grey darker than $gray9** - All greys capped at #1f1f1f
3. **Theme-aware colors** - Use `$color`, `$background`, etc. for theme adaptation
4. **Consistent tokens** - Use the same token for the same purpose across the app
