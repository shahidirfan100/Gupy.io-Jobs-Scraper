# Gupy.io Jobs Scraper

Extract comprehensive job listings from the Gupy jobs portal with ease. Scrape vacancy details including job titles, companies, locations, descriptions, work models, and direct application links at scale. Perfect for job market monitoring, recruitment analysis, and lead generation.

---

## Features

- **Portal URL support** — Extract jobs directly using a `portal.gupy.io/job-search` URL to preserve all filters.
- **Keyword and location search** — Find jobs by keyword and location without needing a full URL.
- **Pagination controls** — Limit the number of results and pages to manage usage and scraping speed.
- **Normalized output** — Get clean, structured datasets with consistent field names.
- **Ready-to-use datasets** — Export job records for market analysis, lead generation, or custom databases.

---

## Use Cases

### Job Market Research
Track hiring volume, job titles, and location patterns across the Gupy ecosystem. Build datasets for recruiting research, salary benchmarking support, or trend analysis.

### Lead Generation
Identify companies hiring for specific roles, regions, or work models. Use the dataset to monitor employers and career pages relevant to your niche.

### Competitive Intelligence
Compare open roles, publication cadence, and workplace models across employers. Spot which companies are growing, hiring remotely, or expanding into new locations.

### Recruitment Automation
Feed job results into spreadsheets, internal dashboards, or workflow tools. Use recurring runs to keep job pipelines fresh without manual searching.

---

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | String | No | `https://portal.gupy.io/job-search/sortBy=publishedDate` | Gupy search URL from `portal.gupy.io/job-search`. If provided, its filters are used first. |
| `keyword` | String | No | — | Optional job keyword when you do not want to use a full URL. |
| `location` | String | No | — | Optional city or state such as `Sao Paulo`, `Sao Paulo - SP`, or `Pernambuco`. |
| `sortBy` | String | No | `"publishedDate"` | Sort order used when searching with keyword and location. |
| `results_wanted` | Integer | No | `20` | Maximum number of jobs to collect. |
| `max_pages` | Integer | No | `1` | Safety cap for pagination. |
| `proxyConfiguration` | Object | No | `{"useApifyProxy": false}` | Optional Apify proxy settings. |

---

## Output Data

Each item in the dataset contains:

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | Integer | Unique Gupy job identifier. |
| `title` | String | Job title. |
| `company` | String | Company or career page name. |
| `companyId` | Integer | Company identifier. |
| `careerPageId` | Integer | Career page identifier. |
| `careerPageName` | String | Career page name from Gupy. |
| `careerPageLogoUrl` | String | Company logo URL. |
| `careerPageUrl` | String | Career page URL. |
| `descriptionHtml` | String | Rich job description content. |
| `descriptionText` | String | Plain-text job description. |
| `jobType` | String | Raw job type code. |
| `jobTypeLabel` | String | Readable job type label. |
| `publishedDate` | String | Publish timestamp. |
| `applicationDeadline` | String | Application deadline when available. |
| `isRemoteWork` | Boolean | Whether the role is marked as remote. |
| `workplaceType` | String | Raw workplace type code. |
| `workplaceTypeLabel` | String | Readable work model label. |
| `city` | String | Job city. |
| `state` | String | Job state. |
| `country` | String | Job country. |
| `location` | String | Combined location string. |
| `jobUrl` | String | Direct link to the vacancy. |
| `acceptsDisabilities` | Boolean | Whether the vacancy is flagged for PWD applicants. |
| `skills` | Array | Skills when present. |
| `sourceUrl` | String | Source search URL used for the run. |

---

## Usage Examples

### Latest Jobs

```json
{
  "url": "https://portal.gupy.io/job-search/sortBy=publishedDate",
  "results_wanted": 20,
  "max_pages": 1
}
```

### Keyword Search

```json
{
  "keyword": "Social Media",
  "results_wanted": 30,
  "max_pages": 2
}
```

### Location Search

```json
{
  "location": "Sao Paulo - SP",
  "results_wanted": 25,
  "max_pages": 2
}
```

---

## Sample Output

```json
{
  "jobId": 11331333,
  "title": "ATENDENTE RESTAURANTE 12X36 ( CENTRO - BELFORD ROXO/RJ)",
  "company": "McDonald's Restaurante - Arcos Dorados",
  "companyId": 68123,
  "careerPageId": 164080,
  "careerPageName": "McDonald's Restaurante - Arcos Dorados",
  "careerPageLogoUrl": "https://attachments.gupy.io/production/companies/68123/career/164080/images/2023-07-20_22-47_companyLogoUrl.png",
  "careerPageUrl": "https://restaurantemc.gupy.io/eyJzb3VyY2UiOiJndXB5X3BvcnRhbCJ9",
  "descriptionHtml": "#A gente vai amar muito se voce...",
  "descriptionText": "#A gente vai amar muito se voce... Responsabilidades e atribuicoes...",
  "jobType": "vacancy_type_effective",
  "jobTypeLabel": "Effective",
  "publishedDate": "2026-05-21T03:00:25.306Z",
  "applicationDeadline": "2026-07-20",
  "isRemoteWork": false,
  "workplaceType": "on-site",
  "workplaceTypeLabel": "On-site",
  "city": "Belford Roxo",
  "state": "Rio de Janeiro",
  "country": "Brasil",
  "location": "Belford Roxo, Rio de Janeiro, Brasil",
  "jobUrl": "https://restaurantemc.gupy.io/job/eyJqb2JJZCI6MTEzMzEzMzMsInNvdXJjZSI6Imd1cHlfcG9ydGFsIn0=?jobBoardSource=gupy_portal",
  "acceptsDisabilities": true,
  "sourceUrl": "https://portal.gupy.io/job-search/sortBy=publishedDate"
}
```

---

## Tips for Best Results

### Use Real Portal URLs
- Copy the full Gupy search URL from your browser when you need exact work model, job type, or date filters.
- This ensures the scraper uses the precise parameters you configured visually on the website.

### Start with Small Batches
- Use a low `results_wanted` (e.g., 20) and limit `max_pages` to 1 or 2 during testing.
- This allows you to verify your query configuration before initiating large scraping runs.

### Optimize Location Queries
- Input clear location details like `Sao Paulo`, `Rio de Janeiro - RJ`, or full state names like `Parana`.
- This matches the portal's search engine standards for cleaner and more relevant filtering.

### Control Large Crawls
- Large queries can return thousands of results, which consumes more resources.
- Set a sensible limit using `results_wanted` and `max_pages` to keep runs fast and cost-efficient.

---

## Proxy Configuration

For reliable scraping and to avoid rate limits, residential proxies are recommended:

```json
{
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

---

## Integrations

Connect your data with:

- **Google Sheets** — Export job listings directly to spreadsheets for easy analysis
- **Airtable** — Build searchable job boards and hiring pipelines
- **Zapier** — Automate alerts and downstream workflow triggers
- **Make** — Connect your runs to hundreds of third-party apps
- **Webhooks** — Send real-time data to your custom API endpoints

### Export Formats

- **JSON** — For developers and seamless API integrations
- **CSV** — Ideal for spreadsheet applications and reporting
- **Excel** — For sharing with business teams
- **XML** — For legacy system integrations

---

## Frequently Asked Questions

### How many jobs can I scrape?
You can scrape all public job listings returned by the search query. The exact limit depends on Gupy's platform and pagination restrictions.

### Can I scrape multiple pages?
Yes, the scraper automatically navigates through pagination up to your defined `max_pages` limit.

### Do I need a Gupy account to use this scraper?
No, the scraper works with publicly available job search endpoints and does not require credentials or logging in.

### Why are some fields empty in the output?
Some job listings may not contain optional fields like skills, application deadlines, or specific work models. Empty values are omitted to keep your dataset clean.

### What is the difference between keyword search and using a portal URL?
Using a portal URL allows you to apply complex filters (like specific work formats or companies) directly from the Gupy website. Keyword search is a simpler way to search for jobs by title or term directly.

### Can I run the scraper on a schedule?
Yes, you can schedule runs hourly, daily, or weekly using Apify's scheduling tool in the Console.

---

## Support

For issues, feature requests, or custom scraping needs, contact support through the Apify Console.

### Resources

- [Apify Documentation](https://docs.apify.com/)
- [API Reference](https://docs.apify.com/api/v2)
- [Scheduling Runs](https://docs.apify.com/schedules)

---

## Legal Notice

This actor is designed for legitimate data collection purposes. Users are responsible for ensuring compliance with website terms of service and applicable laws. Use data responsibly and respect rate limits.
