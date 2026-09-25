import { CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, objectsAndMonumentsSummary, searchFields } from '@museumwnf/viewer-core'
import { search } from '../dataset.config.js'
import { useData } from './data.js'

// The catalogue spec: what this website's lists filter and search on. The
// engine — query state, options, dates, pages, the keyword grammar, the
// fields of the legacy search form, the result row — is viewer-core's
// catalogue layer and viewer-layout's views; what is declared here is only
// what is this website's: the scope rule, the three facets of the Permanent
// Collection, and the `permanentCollection` spec that composes them for
// viewer-layout's `CatalogueResultsView`. Two entrances and two results pages
// read this one declaration.

const {
  countries, dynasties, dynastyLabel, countryLabel, itemRow, partnerLabel, partners,
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

// ── The Permanent Collection, as a spec ─────────────────────────────────────
//
// What viewer-layout's `CatalogueResultsView` renders on
// `/permanent-collection/results`: the three facets above over every record,
// as legacy offered them, the scope rule, the two years, the Explore
// checkbox, the standalone date rule, chronological order, twenty rows a
// page, and legacy's count phrased as "[N objects, M monuments]". Every text
// is an entry name; the check that every name resolves reads them here.

// The row: the thumbnail, the name, the country, the date, the dynasties and
// the holder. Shared with the Timeline gallery (composables/timeline.js) and
// the partner page's held items, which list the same items under the same
// shape.
export const itemRecord = (item) => itemRow(item, ['country', 'dates', 'dynasties', 'holder'])

export const permanentCollection = {
  entity: 'items',
  keys: ['country', 'dynasty', 'partner', 'begin', 'end', 'epm'],
  facets: FACETS,
  facetScope: 'all',
  scope: (item, filters) => inScope(item, filters.epm === '1'),
  controls: [
    { key: 'country', label: 'catalogue.facet.country', anyLabel: 'catalogue.facet.any' },
    { key: 'dynasty', label: 'catalogue.facet.periodDynasty', anyLabel: 'catalogue.facet.any' },
    { key: 'partner', label: 'catalogue.facet.holdingInstitution', anyLabel: 'catalogue.facet.any' },
    { key: 'begin', type: 'year', label: 'catalogue.facet.fromYear', placeholder: 'timeline.form.fromYearHint' },
    { key: 'end', type: 'year', label: 'catalogue.facet.toYear', placeholder: 'timeline.form.toYearHint' },
    { key: 'epm', type: 'checkbox', label: 'islamicart.filter.includeEpm' },
  ],
  filterMode: 'apply',
  filterTitle: 'catalogue.filter.heading',
  dates: { mode: CATALOGUE_DATE_MODE },
  sort: 'chronological',
  pageSize: CATALOGUE_PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsFilter',
  pagination: { window: 7 },
  record: itemRecord,
  summary: objectsAndMonumentsSummary,
}
