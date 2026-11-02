import { CATALOGUE_PAGE_SIZE } from '@museumwnf/viewer-core'
import { useData } from './data.js'
import { centuries, inScope, legacyOrder, resultTile } from './catalogue.js'

// The Timeline, as legacy's hcr_home.php, hcr_result.php and hcr_gallery.php
// read it, drawn by viewer-layout's standalone family (TimelineEntrance.vue,
// TimelineResults.vue, TimelineGallery.vue). What is declared here is only
// this website's: which events a search finds and in what order, the lists
// the pages offer, the line that says the search in words, and the records
// the gallery shows. Every word is legacy's own (islamicart.tl.*, its
// translation table).
//
// The query: `country` (`none` when no country was chosen, empty for all
// countries) and `start`/`end` (`none` for a list left on its first entry),
// as legacy's own lists sent them; `page` for the results' pages. The item
// sheet and the dynasty pages link with `begin` for the start and
// `country=all`, which read the same.

const { countryLabel, items, md, timelineEvents, tr } = useData()

/** Legacy's period when a date was left on its first entry. */
const DEFAULT_START = 400
const DEFAULT_END = 2000

/** Fifteen events a page, as hcr_result.php showed them. */
export const EVENTS_PAGE_SIZE = 15

const chosen = (value) => value !== undefined && value !== null && value !== '' && value !== 'none'

/** The search a query stands for: the country (empty for all) and the period. */
export function timelineQuery(query) {
  return {
    country: query.country === 'all' ? '' : query.country ?? '',
    start: query.start ?? query.begin ?? 'none',
    end: query.end ?? 'none',
  }
}

export function timelineSearch(raw) {
  const query = timelineQuery(raw)
  return {
    country: query.country,
    start: chosen(query.start) ? Number(query.start) : DEFAULT_START,
    end: chosen(query.end) ? Number(query.end) : DEFAULT_END,
  }
}

/** "[DATE] A.D.", legacy's `AD` word, for a year. */
export const yearLabel = (t, year) => t('islamicart.tl.ad').replace('[DATE]', String(year))

// HCRList::Search: an event with an end runs into the period, one without
// falls inside it, both bounds left open; the country, when one is chosen;
// in order of its first year.
export function findEvents(search) {
  const { country, start, end } = search
  return (timelineEvents.value ?? [])
    .filter((event) => {
      const from = Number(event.year_from) || 0
      const to = Number(event.year_to) || 0
      const inPeriod = to ? to > start && from < end : from > start && from < end
      return inPeriod && (!country || event.country_id === country)
    })
    .sort((a, b) => (a.year_from - b.year_from) || (a.display_order - b.display_order))
}

/** An event as hcr_result.php printed it: its years, its country, its description. */
export function eventRow(event, t) {
  const text = tr('timeline_events', event.id)
  let years = event.year_from ? String(event.year_from) : ''
  if (event.year_to) years += ` - ${event.year_to}`
  return {
    id: event.id,
    date: yearLabel(t, years),
    country: event.country_id ? countryLabel(event.country_id) : '',
    html: text.description ? md(text.description) : '',
  }
}

// The countries, by name in the page's language. The entrance lists those
// with events and Discover Islamic Art objects, and France, as legacy's
// query did; the results page every country with events.
const byName = (list) => [...list].sort((a, b) => a.label.localeCompare(b.label))
const eventCountries = () => new Set((timelineEvents.value ?? []).map((event) => event.country_id).filter(Boolean))

export function entranceCountries() {
  const withObjects = new Set(
    (items.value ?? []).filter((item) => item.type === 'object' && inScope(item, false)).map((item) => item.country_id),
  )
  return byName(
    [...eventCountries()].filter((id) => withObjects.has(id) || id === 'fra').map((id) => ({ value: id, label: countryLabel(id) })),
  )
}

export function resultCountries() {
  return byName([...eventCountries()].map((id) => ({ value: id, label: countryLabel(id) })))
}

/** The start and end lists: legacy's centuries, from the earliest event to the last. */
export function dateOptions(t) {
  return {
    starts: centuries.value.map((year) => ({ value: year, label: yearLabel(t, year) })),
    ends: centuries.value.map((year) => ({ value: year + 100, label: yearLabel(t, year + 100) })),
  }
}

// hcr_result.php's line over the lists: the period ("De 1000 A.D. à …" in
// French and Spanish), then the country in capitals, or all countries.
export function searchLine(search, t, locale) {
  const to = t('islamicart.tl.to').toLowerCase()
  const period = locale === 'fr' || locale === 'es'
    ? `${t('islamicart.tl.from')} ${yearLabel(t, search.start)} ${to} ${yearLabel(t, search.end)}`
    : `${yearLabel(t, search.start)} ${to} ${yearLabel(t, search.end)}`
  const country = search.country ? countryLabel(search.country) : t('islamicart.tl.allCountries')
  return `${period} | ${country.toLocaleUpperCase(locale)}`
}

// export_hcr_content.php: its line ("TIMELINE | 1000 to 1200 | EGYPT") and
// its file's name.
export function wordLine(search, t, locale) {
  const country = search.country ? countryLabel(search.country) : t('islamicart.tl.allCountries')
  return `${t('islamicart.tl.title').toLocaleUpperCase(locale)} | ${search.start} to ${search.end} | ${country.toLocaleUpperCase(locale)}`
}
export const wordFile = (search, locale) => `DIA_${search.country}-${search.start}-${search.end}-${locale}.doc`

// hcr_gallery.php: Discover Islamic Art's objects and monuments dated inside
// the period, in the country when one is chosen, in legacy's order (the
// start, then the end, then the record's key), twenty a page.
const galleryScope = (search) => (item) =>
  inScope(item, false)
  && (!search.country || item.country_id === search.country)
  && Number.isFinite(item.start_date) && item.start_date >= search.start
  && Number.isFinite(item.end_date) && item.end_date <= search.end

export function galleryItems(search) {
  return (items.value ?? []).filter(galleryScope(search))
}

const galleryOrder = (list) =>
  legacyOrder(list).sort((a, b) => (a.start_date - b.start_date) || (a.end_date - b.end_date))

export function gallerySpec(search) {
  return {
    entity: 'items',
    keys: [],
    scope: galleryScope(search),
    sort: galleryOrder,
    pageSize: CATALOGUE_PAGE_SIZE,
    record: resultTile,
    summary: () => [],
    empty: 'islamicart.tl.empty',
  }
}
