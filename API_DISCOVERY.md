## Selected API

- Endpoint: `https://employability-portal.gupy.io/api/v1/jobs`
- Method: `GET`
- Auth: None
- Pagination: `limit` + `offset`
- Portal URL mapping:
  - `term` -> `jobName`
  - `city[]` -> `city`
  - `jobTypes[]` -> `type`
  - `workplaceTypes[]` -> `workplaceType`
  - `sortBy` -> `sortBy`
  - `state` -> `state`
- Fields available:
  - `id`
  - `companyId`
  - `name`
  - `description`
  - `careerPageId`
  - `careerPageName`
  - `careerPageLogo`
  - `careerPageUrl`
  - `type`
  - `publishedDate`
  - `applicationDeadline`
  - `isRemoteWork`
  - `city`
  - `state`
  - `country`
  - `jobUrl`
  - `workplaceType`
  - `disabilities`
  - `skills`
  - `pagination.total`
- Existing actor fields: 7 documented fields from the old Remote.co scraper
- New actor output: 20+ normalized fields, with empty values omitted from the dataset

## Why This API Was Chosen

- Returns JSON directly with no login and no browser requirement
- Supports stable pagination through `limit` and `offset`
- Supports keyword, city, state, sort, work model, and job type filters
- Provides a richer field set than the old HTML-based actor
- Works with plain `gotScraping` requests using standard `Origin` and `Referer` headers

## Rejected Candidates

- `https://portal.gupy.io/_next/data/.../index.json`
  - Contains page props and feature toggles, but not the paginated job dataset itself
- Company career pages on `*.gupy.io`
  - Rich detail pages exist, but the actor requirement is portal search scraping without HTML parsing
- Browser fallback with Playwright Firefox
  - Not required because the public jobs API is directly accessible over HTTP
