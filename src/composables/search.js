import {
  CATALOGUE_DATE_MODE, SEARCH_LANGUAGE_KEY, searchRowKeys, useLegacySearch,
} from '@museumwnf/viewer-core'
import { SEARCH_FIELDS, SEARCH_SCORE, databaseRow, inScope } from './catalogue.js'

// The search spec: what `CatalogueResultsView` renders on
// `/database/results`, from the query legacy's form writes on `/database`
// (DatabaseSearch.vue, legacy `database.php`'s three keyword rows). The
// search is legacy's (decision D3, viewer-core's `useLegacySearch`): every
// language unless one is chosen, the columns `database_results.php`
// searched, a country's records for a word naming it in Keywords and
// Location, a glossary term's spellings in Keywords, legacy's relevance and
// then the start date.

// `narrow` searches what `scope` (ISL, EPM when asked) let through; the
// results page waits for `prepare()`, which loads every language searched.
export const databaseSearch = useLegacySearch({
  fields: SEARCH_FIELDS,
  score: SEARCH_SCORE,
  countryFields: ['keyword', 'location'],
  glossaryFields: ['keyword'],
})

export const databaseResultsSpec = {
  entity: 'items',
  keys: [...searchRowKeys(), 'from', 'to', SEARCH_LANGUAGE_KEY, 'epm'],
  scope: (item, filters) => inScope(item, filters.epm === '1'),
  narrow: databaseSearch.narrow,
  dates: { mode: CATALOGUE_DATE_MODE, begin: 'from', end: 'to' },
  // The search already put the matches in legacy's order; resorting here
  // would discard it.
  sort: false,
  // Legacy's twelve a page.
  pageSize: 12,
  record: databaseRow,
  // The count is in the heading, as legacy's "| 431 records".
  summary: () => [],
  empty: 'islamicart.dbr.empty',
}
