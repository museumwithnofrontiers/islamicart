import {
  CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, centuryPresets, searchFieldOptions, searchRowKeys, searchSummary, useFieldSearch,
} from '@museumwnf/viewer-core'
import { useData } from './data.js'
import { SEARCH_FIELDS, inScope } from './catalogue.js'

// The search specs: what viewer-layout's `SearchFormView` renders on
// `/database` (`mode: 'rows'`, legacy `database.php`'s three keyword rows)
// and `/permanent-collection` (`mode: 'radio'`, legacy's one-filter-at-a-time
// form), and what `CatalogueResultsView` renders on `/database/results`. The
// field grammar, the keyword rows, the index and the "searched for" line are
// viewer-core's field search; decision D3 turns on its `rank: 'hits'`
// (legacy's `ORDER BY nn DESC, pkdate ASC`) and the glossary/country
// expansions (`database_results.php`'s two lookup rules).

const { itemRow } = useData()

export const databaseSearchSpec = {
  mode: 'rows',
  fields: searchFieldOptions(SEARCH_FIELDS),
  dates: { presets: centuryPresets() },
  // The search language is a record-level filter (which language the
  // keyword is matched against), never the site's own display language.
  language: 'items',
  extras: [{ key: 'epm', type: 'checkbox', label: 'islamicart.filter.includeEpm' }],
  target: 'database-results',
  showAllLabel: 'catalogue.search.showAll',
  // Legacy's field grammar takes no operators (`+`, `-`, `*`, quoted
  // phrases); there is no search-syntax essay to link to.
  howTo: false,
}

// `options` is `useFacets(items, FACETS)`'s own result (composables/catalogue.js),
// read by PermanentCollectionSearch.vue — the radio facets' own values,
// sourced from the records the way every other facet on this site is, never
// invented here.
export function permanentCollectionSearchSpec(options) {
  return {
    mode: 'radio',
    facets: [
      { key: 'country', label: 'catalogue.facet.country', options: options.country ?? [] },
      { key: 'dynasty', label: 'catalogue.facet.periodDynasty', options: options.dynasty ?? [] },
      { key: 'partner', label: 'catalogue.facet.holdingInstitution', options: options.partner ?? [] },
      { key: 'begin', label: 'catalogue.facet.startDate', type: 'year' },
      { key: 'end', label: 'catalogue.facet.endDate', type: 'year' },
    ],
    // Writes the exact keys `permanentCollectionResultsSpec` (composables/catalogue.js)
    // already reads.
    extras: [{ key: 'epm', type: 'checkbox', label: 'islamicart.filter.includeEpm' }],
    target: 'permanent-collection-results',
  }
}

// The index behind the results page: one for the site's life, its search
// language following the query's. It searches every item regardless of
// scope; `narrow` keeps its rank order over what `scope` (ISL/EPM) let
// through.
const { narrow } = useFieldSearch({ fields: SEARCH_FIELDS })

// Legacy's recap line names the Explore opt-in after the keyword rows.
const explore = (filters, t) => (filters.epm === '1' ? `+ ${t('core.project.explorePartners')}` : '')

export const databaseResultsSpec = {
  entity: 'items',
  keys: [...searchRowKeys(), 'from', 'to', 'lang', 'epm'],
  scope: (item, filters) => inScope(item, filters.epm === '1'),
  narrow,
  dates: { mode: CATALOGUE_DATE_MODE, begin: 'from', end: 'to' },
  // `rank: 'hits'` already ordered the matches (or the entity order stood,
  // on an empty query); resorting here would discard that order.
  sort: false,
  pageSize: CATALOGUE_PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  // Legacy database_results.php's own row: the country, the date and the
  // location, distinct from the Permanent Collection's.
  record: (item) => itemRow(item, ['country', 'dates', 'location']),
  summary: (ctx) => searchSummary(ctx, { extras: [explore] }),
  // The keyword refine row this results page adds on top of the entrance's
  // three; the field/operator selects beside it are this website's own
  // (DatabaseResults.vue's `filters` slot), since a field name is not a
  // record facet `CatalogueResultsView` can derive options for.
  filterTitle: 'catalogue.search.refine',
  controls: [{ key: 'q4', type: 'query', label: 'catalogue.search.refineHint', placeholder: 'catalogue.search.keywordPlaceholder' }],
  empty: 'catalogue.results.noResultsSearch',
  pagination: { window: 7 },
}
