# Information Architecture & Navigation

The structural map of the product. Source of truth: `registries/product/navigation.json`. This
covers navigation, the module map, and hierarchy in one place (kept together deliberately — they
describe the same structure).

## Navigation model
A **persistent left sidebar** with grouped destinations, a **top bar** (global search,
notifications, persona switcher, profile, and the **Back to Workspace** action), and
**breadcrumbs** within a module. Rationale: enterprise IGA has many destinations; a grouped
sidebar scales better than a top nav, and matches user expectations from tools in this space.

## Navigation groups (in order)
1. **Overview** — Dashboard
2. **My Work** — My Approvals, My Reviews, My Requests *(the "needs my action" hub)*
3. **Directory** — User Identities, App Accounts, Applications, Entitlements, Technical Roles, Business Roles, Governance Groups
4. **Access** — Access Catalog, Roles
5. **Governance** — Certifications, Policies, Risk, Emergency Access, Workflows
6. **Evidence** — Reports, Audit
7. **Administration** — settings, connectors, delegation

> **My Work is first after the dashboard for a reason:** most users come to *do their tasks*.
> Lead with their pending work, not the org-wide directory.

## Permission-aware navigation
Items render only for personas allowed to see them (`personas` in `navigation.json`, aligned with
the permission matrix). An end user sees a lean nav (Dashboard, My Requests, Catalog, Emergency);
an administrator sees everything. **Never render a destination the persona can't use.**

## Hierarchy & depth
Keep depth shallow — **max 3 levels**: `Module → Object list → Object detail`. Object detail uses
**tabs** for related entities rather than deeper nav (e.g. Identity → [Overview | Accounts |
Access | Requests | Risk | History]). This keeps the mental model flat and the URLs predictable.

## Module → destination map
Every module in `product-modules.json` maps to one nav destination, except:
- **Approvals** and **Certifications** each appear twice — once under **My Work** (my tasks) and
  once under **Governance** (admin/oversight view). Same module, two entry points, different
  scope. Reuse the same inbox pattern.

## URL / routing convention (for later implementation)
`/{module}` → list · `/{module}/{id}` → detail · `/{module}/{id}/{tab}` → detail tab. Keep this
consistent so deep links and breadcrumbs are trivial.

## "Needs my action" everywhere
Badges/counts on **My Approvals**, **My Reviews**, and **Notifications** (`requiresAction: true`)
are the product's pulse. The dashboard mirrors these as the primary landing content.
