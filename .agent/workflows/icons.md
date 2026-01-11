---
description: Guidelines for using icons consistently across the codebase
---

# Icon Usage Guidelines

## Always Use Phosphor Icons

This project uses **Phosphor Icons** (`@phosphor-icons/react`) as the sole icon library.

**DO NOT** use:
- Emojis (📚, 🌙, ⏱️, etc.)
- Other icon libraries (Heroicons, FontAwesome, Lucide, etc.)
- Inline SVGs (except when absolutely necessary for server components)

## Import Pattern

```tsx
import { IconName } from '@phosphor-icons/react';
```

## Common Icons

| Purpose | Icon | Weight |
|---------|------|--------|
| Books/Library | `Books` | duotone |
| Calendar | `Calendar` | duotone |
| Clock/Time | `Clock` or `Timer` | regular |
| Star/Rating | `Star` | fill |
| Sparkle/Magic | `Sparkle` | duotone |
| Moon | `Moon` | duotone |
| Chart | `ChartBar` | duotone |
| Notebook/Clipboard | `Notebook` or `Clipboard` | duotone |
| Settings | `Gear` | duotone |
| User/Profile | `User` | duotone |
| Edit/Pencil | `PencilSimple` | regular |
| Delete/Trash | `Trash` | regular |
| Add/Plus | `Plus` | bold |
| Close/X | `X` | bold |
| Arrow | `CaretLeft`, `CaretRight` | bold |
| External Link | `ArrowSquareOut` | regular |
| Print | `Printer` | bold |
| Graduation/Education | `GraduationCap` | duotone |

## Size Guidelines

- Small (inline text): `size={12}` or `size={14}`
- Regular: `size={16}` or `size={18}`
- Medium: `size={20}` or `size={24}`
- Large (headers): `size={28}` or `size={32}`

## Weight Options

- `thin` - Very light
- `light` - Light
- `regular` - Default
- `bold` - Thick
- `fill` - Solid filled
- `duotone` - Two-tone (recommended for most UI)

## Server Component Exception

For server components where React context isn't available:
1. Try to move the icon to a client component wrapper
2. If that's not possible, use inline SVG from Phosphor's source

```tsx
// Get SVG from: https://phosphoricons.com/
<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
  <path d="..."/>
</svg>
```
