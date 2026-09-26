import {
  CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, dateRange, effectiveYearTo, eventDateLabel, objectsAndMonumentsSummary,
} from '@museumwnf/viewer-core'
import { useData } from './data.js'
import { inScope, itemRecord } from './catalogue.js'

// The timeline spec: what viewer-layout's `TimelineResultsView` renders on
// `/timeline` (the entrance, `entrance: true`) and `/timeline/results` — the
// country/period axis over viewer-core's own chronology engine — and what
// its `CatalogueResultsView` renders on `/timeline/gallery`, decision D1's
// return of legacy `hcr_gallery.php`: the Permanent Collection's own items,
// scoped to the country and period the timeline page was showing, offered
// once that period actually has objects. Almost every text the engine needs
// already lives in the shared `timeline.*` catalogue; what is declared here
// is only the country/period axis, this website's own events-to-items link,
// and the gallery's scope.

const { countryLabel, items, md, mdInline, tr } = useData()

/** `useTimelineEvents`'s own `tr(id)` contract, bound to this site's `tr`. */
const trEvents = (id) => tr('timeline_events', id)

// Free country and free year inputs — the same on the entrance and the
// results, unlike the DXA family's century-bucketed selects.
const controls = [{ key: 'country' }, { key: 'begin' }, { key: 'end' }]

/** Fifteen rows a page, as the legacy events list showed. */
const EVENTS_PAGE_SIZE = 15

/** The "all countries" sentinel `useTimelineEvents.findEvents` also reads. */
function countryMatches(item, countryId) {
  return !countryId || countryId === 'all' || item.country_id === countryId
}

// The Permanent Collection results, scoped to a country and the interval an
// event or a period covers — the per-event "View items from this period"
// link and the gallery cross-link's own item count both build this query.
function periodQuery(countryId, begin, end) {
  const query = {}
  if (countryId) query.country = countryId
  if (begin != null) query.begin = String(begin)
  if (end != null) query.end = String(end)
  return query
}

function itemsFromEvent(event) {
  const end = effectiveYearTo(event) ?? event.year_from
  return { name: 'permanent-collection-results', query: periodQuery(event.country_id, event.year_from, end) }
}

function eventRow(event, ctx) {
  return {
    id: event.id,
    date: eventDateLabel(event, event.text, ctx.t),
    caption: event.country_id ? mdInline(countryLabel(event.country_id)) : '',
    description: event.text?.description ? md(event.text.description) : '',
    // `TimelineEventList` renders `action.label` as given — already resolved
    // text, the same convention `caption`/`description` follow above.
    actions: [{ label: ctx.t('timeline.action.viewItemsFromPeriod'), to: itemsFromEvent(event) }],
  }
}

// The items a country/period covers, for the "See gallery" cross-link's own
// count. Legacy's `hcr_gallery.php` never offered the Explore Islamic Art
// Collections checkbox, so this stays ISL scope, unlike the Permanent
// Collection and Database pages.
function periodItems(filters) {
  const inCountry = items.value.filter((item) => inScope(item, false) && countryMatches(item, filters.country))
  return dateRange(inCountry, { begin: filters.begin, end: filters.end, mode: CATALOGUE_DATE_MODE })
}

export const timelineEntranceSpec = {
  entrance: true,
  route: 'timeline-results',
  controls,
  countryLabel,
  tr: trEvents,
}

export const timelineResultsSpec = {
  controls,
  countryLabel,
  tr: trEvents,
  pageSize: EVENTS_PAGE_SIZE,
  filterTitle: 'catalogue.filter.heading',
  event: eventRow,
  gallery: { route: 'timeline-gallery', items: ({ filters }) => periodItems(filters) },
  pagination: { window: 7 },
}

// The gallery: the Permanent Collection's own row and summary shapes
// (composables/catalogue.js), scoped to the country and period the timeline
// results page was showing when "See gallery" was followed.
export const timelineGallerySpec = {
  entity: 'items',
  keys: ['country', 'begin', 'end'],
  scope: (item, filters) => inScope(item, false) && countryMatches(item, filters.country),
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
