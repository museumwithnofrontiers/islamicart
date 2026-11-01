import {
  CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, SEARCH_LANGUAGE_KEY, searchRowKeys, searchSummary, useLegacySearch,
} from '@museumwnf/viewer-core'
import { useData } from './data.js'
import { SEARCH_FIELDS, SEARCH_SCORE, inScope } from './catalogue.js'

// The search spec: what `CatalogueResultsView` renders on
// `/database/results`, from the query legacy's form writes on `/database`
// (DatabaseSearch.vue, legacy `database.php`'s three keyword rows). The
// search is legacy's (decision D3, viewer-core's `useLegacySearch`): every
// language unless one is chosen, the columns `database_results.php`
// searched, a country's records for a word naming it in Keywords and
// Location, a glossary term's spellings in Keywords, legacy's relevance and
// then the start date.

const { itemRow } = useData()

// `narrow` searches what `scope` (ISL, EPM when asked) let through; the
// results page waits for `prepare()`, which loads every language searched.
export const databaseSearch = useLegacySearch({
  fields: SEARCH_FIELDS,
  score: SEARCH_SCORE,
  countryFields: ['keyword', 'location'],
  glossaryFields: ['keyword'],
})

// Legacy's recap line names the Explore opt-in after the keyword rows.
const explore = (filters, t) => (filters.epm === '1' ? `+ ${t('core.project.explorePartners')}` : '')

export const databaseResultsSpec = {
  entity: 'items',
  keys: [...searchRowKeys(), 'from', 'to', SEARCH_LANGUAGE_KEY, 'epm'],
  scope: (item, filters) => inScope(item, filters.epm === '1'),
  narrow: databaseSearch.narrow,
  dates: { mode: CATALOGUE_DATE_MODE, begin: 'from', end: 'to' },
  // The search already put the matches in legacy's order; resorting here
  // would discard it.
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
