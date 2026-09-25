import { useCatalogue } from '@museumwnf/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core's catalogue data layer, lazily. Each entity is a shared ref that
// stays `null` until a route declaring it in `meta.entities` brings its chunk
// in, so importing this module loads nothing, and a page pays only for what
// it reads. The entity refs and lookups, the labels, the routes, the result
// row, the translations and the Markdown pipeline are `useCatalogue`'s. What
// is this website's own: the timeline and collection entities it reads on
// top. The Exhibitions and Artistic Introduction collection trees live in
// composables/exhibitions.js and composables/artIntro.js, over
// `useCollectionTree`; which projects are in scope for search and the partner
// entrance is `dataset.config.js`'s own (#1727 phase 4).

// English is the base language of every catalogue in the platform: every
// list, label and fallback reads it. A record the visitor reads in another
// language is resolved on the sheet itself, by viewer-core's
// `useRecordLanguage`.
const defaultLang = 'en'

const catalogue = useCatalogue({
  eager: ['items', 'countries', 'dynasties', 'partners', 'timeline_events', 'collections'],
  defaultLanguage: defaultLang,
})
catalogue.loadEnglish()

const timelines = catalogue.entity('timelines')
const timelineEvents = catalogue.entity('timeline_events')
const collections = catalogue.entity('collections')

export function useData() {
  return { ...catalogue, timelines, timelineEvents, collections, defaultLang }
}
