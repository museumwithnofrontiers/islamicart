import {
  CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, SEARCH_LANGUAGE_KEY, searchRowKeys, searchSummary, useFieldSearch,
} from '@museumwnf/viewer-core'
import { useData } from './data.js'
import { SEARCH_FIELDS, inScope } from './catalogue.js'

// The search spec: what `CatalogueResultsView` renders on
// `/database/results`, from the query legacy's form writes on `/database`
// (DatabaseSearch.vue, legacy `database.php`'s three keyword rows). The
// field grammar, the keyword rows, the index and the "searched for" line are
// viewer-core's field search; decision D3 turns on its `rank: 'hits'`
// (legacy's `ORDER BY nn DESC, pkdate ASC`) and the glossary/country
// expansions (`database_results.php`'s two lookup rules).

const { itemRow } = useData()

// The index behind the results page: one for the site's life, its search
// language following the query's. It searches every item regardless of
// scope; `narrow` keeps its rank order over what `scope` (ISL/EPM) let
// through.
const { narrow } = useFieldSearch({ fields: SEARCH_FIELDS })

// Legacy's recap line names the Explore opt-in after the keyword rows.
const explore = (filters, t) => (filters.epm === '1' ? `+ ${t('core.project.explorePartners')}` : '')

export const databaseResultsSpec = {
  entity: 'items',
  keys: [...searchRowKeys(), 'from', 'to', SEARCH_LANGUAGE_KEY, 'epm'],
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
