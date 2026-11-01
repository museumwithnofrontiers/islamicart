import { computed } from 'vue'
import { CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, dateRange, removeEndingPoint, searchFields } from '@museumwnf/viewer-core'
import { search } from '../dataset.config.js'
import { useData } from './data.js'
import { namesCountry } from './sheet.js'

// The catalogue spec: what this website's lists filter and search on. The
// engine — query state, options, dates, pages, the keyword grammar, the
// fields of the legacy search form, the result row — is viewer-core's
// catalogue layer and viewer-layout's views; what is declared here is only
// what is this website's: the scope rule, the three facets of the Permanent
// Collection, and the `permanentCollectionResultsSpec` that composes them for
// viewer-layout's `CatalogueResultsView`. Two entrances and two results pages
// read this one declaration.

const {
  countries, dynasties, dynastyLabel, countryLabel, itemRoute, itemRow, languageOf, partnerLabel, partners, timelineEvents,
} = useData()

/**
 * `dataset.config.js`'s `search.defaultProjects` (the site's primary project,
 * "Discover Islamic Art") is always searched and browsed; `optionalProjects`
 * ("Explore Islamic Art Collections") is opt-in — legacy database.php's
 * "Include Explore Islamic Art Collections" checkbox.
 */
export function inScope(item, includeEpm) {
  const scoped = includeEpm ? [...search.defaultProjects, ...search.optionalProjects] : search.defaultProjects
  return !item.project_id || scoped.includes(item.project_id)
}

// The nine fields of database.php: Islamic Art's form is the one with the
// dynasty field. Decision D3's country expansion reads the raw ids the
// keyword and location fields carry.
export const SEARCH_FIELDS = searchFields({ dynastyLabel })

// ── The facets of the Permanent Collection ─────────────────────────────────
//
// Countries and institutions by name; dynasties in the order they rose, as
// legacy listed them. A value the reference entity does not carry is not
// offered: the label would be an id.

const dynastyFrom = (id) => dynasties.value?.find((d) => d.id === id)?.from_ad ?? 9999

export const FACETS = {
  country: {
    field: 'country_id',
    label: countryLabel,
    include: (id) => (countries.value ?? []).some((c) => c.id === id),
  },
  dynasty: {
    values: (item) => item.dynasty_ids ?? [],
    label: dynastyLabel,
    include: (id) => (dynasties.value ?? []).some((d) => d.id === id),
    sort: (a, b) => dynastyFrom(a.value) - dynastyFrom(b.value),
  },
  partner: {
    field: 'partner_id',
    label: partnerLabel,
    include: (id) => (partners.value ?? []).some((p) => p.id === id),
  },
}

// ── Legacy's centuries ──────────────────────────────────────────────────────
//
// The Start and End Date lists of the entrance and the results: every
// century from the timeline's earliest event to its last ("400 A.D." …
// "1900 A.D." to start, a century later to end), as legacy read them from
// its timeline table.
export const centuries = computed(() => {
  const years = (timelineEvents.value ?? []).map((e) => e.year_from).filter((y) => Number.isFinite(y))
  if (!years.length) return []
  const list = []
  for (let c = Math.floor(Math.min(...years) / 100) * 100; c < Math.max(...years); c += 100) list.push(c)
  return list
})

/**
 * The window a results page reads: legacy took both dates together, the
 * first century standing for a missing start and the last for a missing end.
 * Null when neither is set.
 */
export function dateWindow(filters) {
  if (!filters.begin && !filters.end) return null
  const list = centuries.value
  return {
    begin: filters.begin || String(list[0] ?? ''),
    end: filters.end || String(list.length ? list[list.length - 1] + 100 : ''),
  }
}

// ── The Permanent Collection, as a spec ─────────────────────────────────────
//
// What viewer-layout's `CatalogueResultsView` renders on
// `/permanent-collection/results` (PermanentCollectionResults.vue draws the
// heading, the tiles, the side panel and the pages around it): the three
// facets above, both projects (legacy's pclist_all.php always read the
// Discover Islamic Art and the Explore Islamic Art Collections records), the
// date window, legacy's order and twenty records a page.

// The row: the thumbnail, the name, the country, the date, the dynasties and
// the holder. Shared with the Timeline gallery (composables/timeline.js) and
// the partner page's held items, which list the same items under the same
// shape.
export const itemRecord = (item) => itemRow(item, ['country', 'dates', 'dynasties', 'holder'])

// Legacy's order: `ORDER BY start_date * 1, project, country, partner code,
// number`, a record with no start first (MySQL's NULL), the four keys read
// from the record's legacy key (mwnf3:objects:ISL:it:Mus01:26; the partner
// code without its first two letters, as legacy's SUBSTRING(museum_id, 3)).
const legacyKey = (item) => {
  const [, , project = '', country = '', partner = '', number = '0'] = (item.backward_compatibility ?? '').split(':')
  return { project, country, partner: partner.slice(2), number: Number(number) || 0 }
}
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
export function legacyOrder(list) {
  const start = (item) => (Number.isFinite(item.start_date) ? item.start_date : -Infinity)
  return [...list].sort((a, b) => {
    const ka = legacyKey(a)
    const kb = legacyKey(b)
    return (start(a) - start(b) || 0)
      || byText(ka.project, kb.project) || byText(ka.country, kb.country)
      || byText(ka.partner, kb.partner) || ka.number - kb.number
  })
}

// Legacy's tile (pclist_all.php): the name; the date and the free-text
// dynasty; the holding museum; the location, the province and the country's
// name, each without its ending period. The country is named in the language
// the item is shown in: the display language when the item has text there,
// English otherwise, as legacy printed "Turin, Italy" on its French page.
function resultTile(item, { tr, renderInline }) {
  const text = tr('items', item.id)
  const plain = (value) => removeEndingPoint(String(value ?? '').replace(/[\r\n]/g, ''))
  const dates = [plain(text.dates), plain(text.dynasty)].filter(Boolean).join(', ')
  const location = [plain(text.location), plain(text.province)]
    .concat(namesCountry(item) ? countryLabel(item.country_id, languageOf('items', item.id)) : '')
    .filter(Boolean)
    .join(', ')
  return {
    id: item.id,
    to: itemRoute(item),
    image: item.images?.[0]?.url ?? '',
    name: renderInline(plain(text.name ?? item.internal_name)),
    lines: dates ? [renderInline(dates)] : [],
    holder: text.holder ? renderInline(plain(text.holder)) : '',
    location: renderInline(location),
  }
}

export const permanentCollectionResultsSpec = {
  entity: 'items',
  keys: ['country', 'dynasty', 'partner', 'begin', 'end'],
  facets: FACETS,
  facetScope: 'all',
  scope: (item) => inScope(item, true),
  narrow: (list, filters) => {
    const window = dateWindow(filters)
    return window ? dateRange(list, { ...window, mode: CATALOGUE_DATE_MODE }) : list
  },
  sort: legacyOrder,
  pageSize: CATALOGUE_PAGE_SIZE,
  record: resultTile,
  // The count is in the heading, as legacy's "[N Objects, M Monuments]".
  summary: () => [],
  empty: 'islamicart.pcr.empty',
}
