# Gupy.io Jobs Scraper

Collect job listings from the Gupy jobs portal in a clean, analysis-ready format. Capture job titles, companies, locations, work models, publish dates, application deadlines, descriptions, skills, and direct job links at scale.

## Features

- **Portal URL support** - Use a `portal.gupy.io/job-search` URL to preserve the exact filters you see on the site
- **Keyword and location search** - Build a search without copying a full URL
- **Pagination controls** - Limit both the number of results and the number of pages
- **Normalized output** - Get consistent field names with empty values omitted from the dataset
- **Store-ready dataset** - Save structured job records for analysis, monitoring, or export

## Use Cases

### Job Market Research

Track hiring volume, job titles, and location patterns across the Gupy ecosystem. Build datasets for recruiting research, salary benchmarking support, or trend analysis.

### Lead Generation

Identify companies hiring for specific roles, regions, or work models. Use the dataset to monitor employers and career pages relevant to your niche.

### Competitive Intelligence

Compare open roles, publication cadence, and workplace models across employers. Spot which companies are growing, hiring remotely, or expanding into new locations.

### Recruitment Automation

Feed job results into spreadsheets, internal dashboards, or workflow tools. Use recurring runs to keep job pipelines fresh without manual searching.

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | String | No | `https://portal.gupy.io/job-search/sortBy=publishedDate` | Gupy search URL from `portal.gupy.io/job-search`. If provided, its filters are used first. |
| `keyword` | String | No | — | Optional job keyword when you do not want to use a full URL. |
| `location` | String | No | — | Optional city or state such as `Sao Paulo`, `Sao Paulo - SP`, or `Pernambuco`. |
| `sortBy` | String | No | `publishedDate` | Sort order used when searching with keyword and location. |
| `results_wanted` | Integer | No | `20` | Maximum number of jobs to collect. |
| `max_pages` | Integer | No | `1` | Safety cap for pagination. |
| `proxyConfiguration` | Object | No | `{"useApifyProxy": false}` | Optional Apify proxy settings. |

## Output Data

Each dataset item can contain:

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

Empty values are not stored, so records stay compact and easier to work with.

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

### Filtered Portal URL

```json
{
  "url": "https://portal.gupy.io/job-search/workplaceTypes[]=remote",
  "results_wanted": 40,
  "max_pages": 3
}
```

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

## Tips for Best Results

### Use Real Portal URLs for Complex Filters

When you need exact work model or job type filters, copy the full Gupy search URL from your browser. This is the easiest way to mirror what you see on the portal.

### Start Small

Use `results_wanted: 20` and `max_pages: 1` or `2` while validating a new search. Increase limits once you confirm the search returns the right kind of jobs.

### Use Clear Location Inputs

For better filtering, use values such as `Sao Paulo`, `Sao Paulo - SP`, or full state names like `Pernambuco`.

### Watch Large Searches

Broad searches can return thousands of jobs. Set `max_pages` intentionally to control runtime and output size.

## Proxy Configuration

If you want to route requests through Apify Proxy:

```json
{
  "proxyConfiguration": {
    "useApifyProxy": true
  }
}
```

## Integrations

- **Google Sheets** - Export job data for reporting
- **Airtable** - Build searchable hiring databases
- **Zapier** - Trigger follow-up workflows
- **Make** - Connect recurring job runs to other tools
- **Webhooks** - Send results into your own systems

## Export Formats

- **JSON** - Ideal for APIs and downstream processing
- **CSV** - Easy to review in spreadsheets
- **Excel** - Business reporting and sharing
- **XML** - Legacy system integrations
