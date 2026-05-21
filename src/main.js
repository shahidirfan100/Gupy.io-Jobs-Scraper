import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { Actor, log } from 'apify';
import { load as cheerioLoad } from 'cheerio';
import { Dataset } from 'crawlee';
import { gotScraping } from 'got-scraping';

const GUPY_PORTAL_BASE_URL = 'https://portal.gupy.io';
const GUPY_API_BASE_URL = 'https://employability-portal.gupy.io/api/v1/jobs';
const DEFAULT_RESULTS_WANTED = 20;
const DEFAULT_MAX_PAGES = 5;
const DEFAULT_SORT_BY = 'publishedDate';
const MAX_API_LIMIT = 100;

const JOB_TYPE_LABELS = {
    vacancy_type_apprentice: 'Apprentice',
    vacancy_type_effective: 'Effective',
    vacancy_type_internship: 'Internship',
    vacancy_type_talent_pool: 'Talent Pool',
    vacancy_type_temporary: 'Temporary',
};

const WORKPLACE_TYPE_LABELS = {
    hybrid: 'Hybrid',
    on_site: 'On-site',
    'on-site': 'On-site',
    remote: 'Remote',
};

const BRAZILIAN_STATES = new Map([
    ['AC', 'Acre'],
    ['ACRE', 'Acre'],
    ['AL', 'Alagoas'],
    ['ALAGOAS', 'Alagoas'],
    ['AP', 'Amapá'],
    ['AMAPA', 'Amapá'],
    ['AM', 'Amazonas'],
    ['AMAZONAS', 'Amazonas'],
    ['BA', 'Bahia'],
    ['BAHIA', 'Bahia'],
    ['CE', 'Ceará'],
    ['CEARA', 'Ceará'],
    ['DF', 'Distrito Federal'],
    ['DISTRITO FEDERAL', 'Distrito Federal'],
    ['ES', 'Espírito Santo'],
    ['ESPIRITO SANTO', 'Espírito Santo'],
    ['GO', 'Goiás'],
    ['GOIAS', 'Goiás'],
    ['MA', 'Maranhão'],
    ['MARANHAO', 'Maranhão'],
    ['MT', 'Mato Grosso'],
    ['MATO GROSSO', 'Mato Grosso'],
    ['MS', 'Mato Grosso do Sul'],
    ['MATO GROSSO DO SUL', 'Mato Grosso do Sul'],
    ['MG', 'Minas Gerais'],
    ['MINAS GERAIS', 'Minas Gerais'],
    ['PA', 'Pará'],
    ['PARA', 'Pará'],
    ['PB', 'Paraíba'],
    ['PARAIBA', 'Paraíba'],
    ['PR', 'Paraná'],
    ['PARANA', 'Paraná'],
    ['PE', 'Pernambuco'],
    ['PERNAMBUCO', 'Pernambuco'],
    ['PI', 'Piauí'],
    ['PIAUI', 'Piauí'],
    ['RJ', 'Rio de Janeiro'],
    ['RIO DE JANEIRO', 'Rio de Janeiro'],
    ['RN', 'Rio Grande do Norte'],
    ['RIO GRANDE DO NORTE', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'],
    ['RIO GRANDE DO SUL', 'Rio Grande do Sul'],
    ['RO', 'Rondônia'],
    ['RONDONIA', 'Rondônia'],
    ['RR', 'Roraima'],
    ['RORAIMA', 'Roraima'],
    ['SC', 'Santa Catarina'],
    ['SANTA CATARINA', 'Santa Catarina'],
    ['SP', 'São Paulo'],
    ['SAO PAULO', 'São Paulo'],
    ['SE', 'Sergipe'],
    ['SERGIPE', 'Sergipe'],
    ['TO', 'Tocantins'],
    ['TOCANTINS', 'Tocantins'],
]);

const AMBIGUOUS_CITY_STATES = new Set(['Rio de Janeiro', 'São Paulo']);
const SAFE_DESCRIPTION_TAGS = new Set([
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'li',
    'ol',
    'p',
    'pre',
    'span',
    'strong',
    'u',
    'ul',
]);
const STRIP_DESCRIPTION_TAGS = new Set([
    'base',
    'canvas',
    'embed',
    'form',
    'iframe',
    'input',
    'link',
    'meta',
    'noscript',
    'object',
    'script',
    'select',
    'style',
    'svg',
    'textarea',
]);

function normalizeAccents(value) {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function normalizeStateToken(value) {
    return normalizeAccents(value).trim().toUpperCase();
}

function sanitizePositiveInteger(value, fallback) {
    const normalized = Number(value);
    return Number.isFinite(normalized) && normalized > 0 ? Math.floor(normalized) : fallback;
}

function splitLocation(value) {
    return value
        .split(/\s*(?:,|-|\/)\s*/)
        .map((part) => part.trim())
        .filter(Boolean);
}

export function parseLocation(value) {
    if (!value || typeof value !== 'string') return {};

    const trimmed = value.trim();
    if (!trimmed) return {};

    const parts = splitLocation(trimmed);
    if (parts.length > 1) {
        const maybeState = BRAZILIAN_STATES.get(normalizeStateToken(parts.at(-1)));
        if (maybeState) {
            const city = normalizeStateToken(parts[0]) === normalizeStateToken(maybeState)
                ? maybeState
                : parts.slice(0, -1).join(' - ');

            return {
                city,
                state: maybeState,
            };
        }
    }

    const normalizedState = BRAZILIAN_STATES.get(normalizeStateToken(trimmed));
    if (normalizedState) {
        if (AMBIGUOUS_CITY_STATES.has(normalizedState)) {
            return {
                city: normalizedState,
                state: normalizedState,
            };
        }

        return { state: normalizedState };
    }

    return { city: trimmed };
}

function normalizePortalParamKey(key) {
    const strippedKey = key.endsWith('[]') ? key.slice(0, -2) : key;

    switch (strippedKey) {
        case 'term':
            return 'jobName';
        case 'jobTypes':
            return 'type';
        case 'workplaceTypes':
            return 'workplaceType';
        default:
            return strippedKey;
    }
}

function collectParamsFromString(rawValue) {
    const params = new URLSearchParams();
    rawValue
        .split('&')
        .filter(Boolean)
        .forEach((chunk) => {
            const chunkParams = new URLSearchParams(chunk);
            chunkParams.forEach((value, key) => {
                params.append(key, value);
            });
        });
    return params;
}

function buildPortalUrlFromApiParams(apiParams) {
    const portalParams = new URLSearchParams();

    apiParams.forEach((value, key) => {
        if (key === 'jobName') {
            portalParams.append('term', value);
            return;
        }

        if (key === 'type') {
            portalParams.append('jobTypes[]', value);
            return;
        }

        if (key === 'workplaceType') {
            portalParams.append('workplaceTypes[]', value);
            return;
        }

        if (key === 'city') {
            portalParams.append('city[]', value);
            return;
        }

        portalParams.append(key, value);
    });

    const rawParams = portalParams.toString();
    return rawParams ? `${GUPY_PORTAL_BASE_URL}/job-search/${rawParams}` : `${GUPY_PORTAL_BASE_URL}/job-search`;
}

export function parseGupyUrl(rawUrl) {
    const parsedUrl = new URL(rawUrl);
    const apiParams = new URLSearchParams();
    let initialOffset = 0;

    if (parsedUrl.hostname === 'employability-portal.gupy.io' && parsedUrl.pathname.startsWith('/api/v1/jobs')) {
        parsedUrl.searchParams.forEach((value, key) => {
            if (key === 'offset') {
                initialOffset = sanitizePositiveInteger(value, 0);
                return;
            }

            if (key === 'limit' || key === 'page') return;
            apiParams.append(key, value);
        });

        if (!apiParams.has('sortBy')) apiParams.set('sortBy', DEFAULT_SORT_BY);

        return {
            apiParams,
            initialOffset,
            sourceUrl: buildPortalUrlFromApiParams(apiParams),
        };
    }

    if (parsedUrl.hostname !== 'portal.gupy.io' || !parsedUrl.pathname.startsWith('/job-search')) {
        throw new Error('Only Gupy job search URLs are supported.');
    }

    const pathSuffix = parsedUrl.pathname.replace(/^\/job-search\/?/, '');
    const combinedParams = new URLSearchParams();

    if (pathSuffix) {
        const pathParams = collectParamsFromString(pathSuffix);
        pathParams.forEach((value, key) => combinedParams.append(key, value));
    }

    parsedUrl.searchParams.forEach((value, key) => combinedParams.append(key, value));

    combinedParams.forEach((value, rawKey) => {
        const key = normalizePortalParamKey(rawKey);

        if (key === 'page') {
            const pageNumber = sanitizePositiveInteger(value, 1);
            initialOffset = Math.max(0, (pageNumber - 1) * 10);
            return;
        }

        if (key === 'offset') {
            initialOffset = sanitizePositiveInteger(value, 0);
            return;
        }

        if (key === 'limit') return;
        apiParams.append(key, value);
    });

    if (!apiParams.has('sortBy')) apiParams.set('sortBy', DEFAULT_SORT_BY);

    return {
        apiParams,
        initialOffset,
        sourceUrl: rawUrl,
    };
}

export function buildSearchConfiguration(input = {}) {
    const rawUrl = input.url || input.startUrl || input.start_url || input.startUrls?.[0];
    const resultsWanted = sanitizePositiveInteger(
        input.results_wanted ?? input.resultsWanted,
        DEFAULT_RESULTS_WANTED,
    );
    const maxPages = sanitizePositiveInteger(input.max_pages ?? input.maxPages, DEFAULT_MAX_PAGES);

    if (rawUrl) {
        const parsed = parseGupyUrl(rawUrl);
        return {
            apiParams: parsed.apiParams,
            initialOffset: parsed.initialOffset,
            maxPages,
            resultsWanted,
            sourceUrl: parsed.sourceUrl,
        };
    }

    const apiParams = new URLSearchParams();
    const keyword = typeof input.keyword === 'string' ? input.keyword.trim() : '';
    const sortBy = typeof input.sortBy === 'string' && input.sortBy.trim() ? input.sortBy.trim() : DEFAULT_SORT_BY;

    if (keyword) apiParams.set('jobName', keyword);

    const location = parseLocation(input.location);
    if (location.city) apiParams.set('city', location.city);
    if (location.state) apiParams.set('state', location.state);
    apiParams.set('sortBy', sortBy);

    return {
        apiParams,
        initialOffset: 0,
        maxPages,
        resultsWanted,
        sourceUrl: buildPortalUrlFromApiParams(apiParams),
    };
}

export function buildApiUrl(apiParams, limit, offset) {
    const params = new URLSearchParams(apiParams);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    return `${GUPY_API_BASE_URL}?${params.toString()}`;
}

export async function fetchJobsPage({ apiParams, limit, offset, proxyConfiguration }) {
    const url = buildApiUrl(apiParams, limit, offset);
    const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;

    const response = await gotScraping.get(url, {
        proxyUrl,
        retry: {
            limit: 3,
        },
        timeout: {
            request: 30000,
        },
        headers: {
            Accept: 'application/json, text/plain, */*',
            Origin: GUPY_PORTAL_BASE_URL,
            Referer: `${GUPY_PORTAL_BASE_URL}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
        },
    });

    const payload = JSON.parse(response.body);
    if (!Array.isArray(payload.data)) {
        throw new Error(`Unexpected Gupy API response shape for ${url}`);
    }

    return payload;
}

export function sanitizeDescriptionHtml(html) {
    if (!html || typeof html !== 'string') return undefined;

    const $ = cheerioLoad(`<div>${html}</div>`);
    const wrapper = $('div').first();

    // Strip unsafe or presentational markup while keeping structural content tags.
    wrapper.find('*').get().reverse().forEach((element) => {
        const tagName = element.tagName?.toLowerCase();
        if (!tagName) return;

        const node = $(element);
        if (STRIP_DESCRIPTION_TAGS.has(tagName)) {
            node.remove();
            return;
        }

        if (!SAFE_DESCRIPTION_TAGS.has(tagName)) {
            node.replaceWith(node.contents());
            return;
        }

        const rawHref = element.attribs?.href?.trim();
        const attributes = Object.keys(element.attribs || {});
        attributes.forEach((attribute) => node.removeAttr(attribute));

        if (tagName === 'a') {
            if (!rawHref || /^javascript:/i.test(rawHref)) {
                node.removeAttr('href');
            } else {
                node.attr('href', rawHref);
            }
        }
    });

    const sanitizedHtml = wrapper.html()?.trim();
    return sanitizedHtml || undefined;
}

function htmlToText(html) {
    if (!html || typeof html !== 'string') return '';

    const $ = cheerioLoad(`<div>${html}</div>`);
    return $.text().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

export function cleanValue(value) {
    if (Array.isArray(value)) {
        const cleanedArray = value
            .map((item) => cleanValue(item))
            .filter((item) => item !== undefined);
        return cleanedArray.length > 0 ? cleanedArray : undefined;
    }

    if (value && typeof value === 'object') {
        const cleanedEntries = Object.entries(value)
            .map(([key, nestedValue]) => [key, cleanValue(nestedValue)])
            .filter(([, nestedValue]) => nestedValue !== undefined);

        if (cleanedEntries.length === 0) return undefined;
        return Object.fromEntries(cleanedEntries);
    }

    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return value;
}

function getSkills(skills) {
    if (!Array.isArray(skills)) return undefined;
    const filtered = skills.filter((skill) => typeof skill === 'string' && skill.trim());
    return filtered.length > 0 ? filtered : undefined;
}

export function mapJob(job, sourceUrl) {
    const descriptionHtml = sanitizeDescriptionHtml(job.description);
    const location = [job.city, job.state, job.country].filter(Boolean).join(', ');

    return cleanValue({
        jobId: job.id,
        title: job.name,
        company: job.careerPageName,
        companyId: job.companyId,
        careerPageId: job.careerPageId,
        careerPageName: job.careerPageName,
        careerPageLogoUrl: job.careerPageLogo,
        careerPageUrl: job.careerPageUrl,
        descriptionHtml,
        descriptionText: htmlToText(descriptionHtml || job.description),
        jobType: job.type,
        jobTypeLabel: JOB_TYPE_LABELS[job.type] || job.type,
        publishedDate: job.publishedDate,
        applicationDeadline: job.applicationDeadline,
        isRemoteWork: job.isRemoteWork,
        workplaceType: job.workplaceType,
        workplaceTypeLabel: WORKPLACE_TYPE_LABELS[job.workplaceType] || job.workplaceType,
        city: job.city,
        state: job.state,
        country: job.country,
        location,
        jobUrl: job.jobUrl,
        acceptsDisabilities: job.disabilities,
        skills: getSkills(job.skills),
        sourceUrl,
    });
}

export function shouldUseProxy(proxyConfiguration) {
    if (!proxyConfiguration || typeof proxyConfiguration !== 'object') return false;
    if (proxyConfiguration.useApifyProxy) return true;
    return Array.isArray(proxyConfiguration.proxyUrls) && proxyConfiguration.proxyUrls.length > 0;
}

export function getPageSize(resultsWanted) {
    return Math.min(MAX_API_LIMIT, Math.max(1, resultsWanted));
}

async function loadActorInput() {
    const actorInput = (await Actor.getInput()) || {};
    if (Object.keys(actorInput).length > 0) return actorInput;

    try {
        const rawInput = await readFile(new URL('../INPUT.json', import.meta.url), 'utf8');
        return JSON.parse(rawInput);
    } catch {
        return actorInput;
    }
}

export async function runActor() {
    const input = await loadActorInput();
    const config = buildSearchConfiguration(input);
    const proxyConfiguration = shouldUseProxy(input.proxyConfiguration)
        ? await Actor.createProxyConfiguration(input.proxyConfiguration)
        : undefined;

    let savedCount = 0;
    let currentPage = 0;
    let currentOffset = config.initialOffset;

    log.info('Starting Gupy jobs scrape', {
        maxPages: config.maxPages,
        resultsWanted: config.resultsWanted,
        sourceUrl: config.sourceUrl,
    });

    while (savedCount < config.resultsWanted && currentPage < config.maxPages) {
        const pageSize = getPageSize(config.resultsWanted - savedCount);
        const payload = await fetchJobsPage({
            apiParams: config.apiParams,
            limit: pageSize,
            offset: currentOffset,
            proxyConfiguration,
        });

        const jobs = payload.data || [];
        if (jobs.length === 0) {
            log.info('No more jobs returned by the API. Stopping.');
            break;
        }

        const records = jobs
            .slice(0, config.resultsWanted - savedCount)
            .map((job) => mapJob(job, config.sourceUrl));

        await Dataset.pushData(records);

        savedCount += records.length;
        currentPage += 1;
        currentOffset += payload.pagination?.limit || jobs.length;

        log.info('Saved jobs batch', {
            currentOffset,
            currentPage,
            fetched: jobs.length,
            savedCount,
            totalAvailable: payload.pagination?.total,
        });

        if (jobs.length < pageSize) break;
        if (typeof payload.pagination?.total === 'number' && currentOffset >= payload.pagination.total) break;
    }

    log.info('Gupy jobs scrape finished', {
        pagesProcessed: currentPage,
        savedCount,
    });
}

async function main() {
    await Actor.init();
    try {
        await runActor();
    } finally {
        await Actor.exit();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main();
}
