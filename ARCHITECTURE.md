# CareConnect Architecture

- `app/` — Next.js routes, pages and API endpoints
- `components/` — reusable client UI
- `lib/` — database, auth and matching services
- `models/` — MongoDB/Mongoose models
- `scripts/seed.ts` — demo data
- `tests/` — automated matching tests

Matching is deterministic: eligibility → capability → availability architecture → distance → radius expansion.
KYC is a hard gate for volunteer acceptance.
