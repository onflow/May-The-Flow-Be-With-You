# Memoreee Shared Code

This directory contains shared components, hooks, utilities, and styles for the Memoreee platform.

- `components/` — Reusable React components (Steddie, Layout, Nav, etc.)
- `hooks/` — Custom React hooks
- `utils/` — Utility functions
- `styles/` — Global and shared CSS (Tailwind, custom styles, etc.)
- `steddie/` — Steddie’s logic, dialogue, and assets

## UI Component Integration

- Radix UI: Accessible, unstyled UI primitives for dialogs, dropdowns, etc.
- Tailwind CSS: Utility-first CSS framework for styling
- Supabase UI: See [Supabase UI Library](https://supabase.com/blog/supabase-ui-library)

## Note on Silk Removal

Silk components were removed to improve Netlify deployment compatibility and reduce bundle size. Replaced with Radix UI + Tailwind for better performance and maintainability.
