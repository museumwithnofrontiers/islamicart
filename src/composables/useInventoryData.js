import { useCatalogueData } from '@museumwnf/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations, the Markdown pipeline and the label shape are
// `useCatalogueData`'s. The Exhibitions and Artistic Introduction collection
// trees live in composables/exhibitions.js and composables/artIntro.js,
// over `useCollectionTree`; which projects are in scope for search and the
// partner entrance is `dataset.config.js`'s own (#1727 phase 4).

// English is the base language of every catalogue in the platform: every
// list, label and fallback reads it. A record the visitor reads in another
// language is resolved on the sheet itself, by viewer-core's
// `useRecordLanguage`.
const defaultLang = 'en'

const catalogue = useCatalogueData({
  eager: ['items', 'countries', 'dynasties', 'partners', 'timeline_events', 'collections'],
  defaultLanguage: defaultLang,
})
catalogue.loadEnglish()

const { availableLanguages, labelOf, loadTranslations, md, mdInline, mdStrip, translations, tr } = catalogue

// ── Records ────────────────────────────────────────────────────────────────

const items = catalogue.entity('items')
const countries = catalogue.entity('countries')
const partners = catalogue.entity('partners')
const dynasties = catalogue.entity('dynasties')
const timelines = catalogue.entity('timelines')
const timelineEvents = catalogue.entity('timeline_events')
const collections = catalogue.entity('collections')

const itemById = catalogue.index('items')

// ── Labels (always English) — `labelOf`'s one shape, over this site's entities.

function itemLabel(item) {
  return item ? labelOf('items', item.id) : ''
}

function countryLabel(countryId) {
  return countryId ? labelOf('countries', countryId) : ''
}

function dynastyLabel(dynastyId) {
  return dynastyId ? labelOf('dynasties', dynastyId) : ''
}

function partnerLabel(partnerId) {
  return partnerId ? labelOf('partners', partnerId) : ''
}

export function useInventoryData() {
  return {
    items,
    countries,
    partners,
    dynasties,
    timelines,
    timelineEvents,
    collections,
    defaultLang,
    availableLanguages,
    loadTranslations,
    translations,
    tr,
    itemLabel,
    countryLabel,
    dynastyLabel,
    partnerLabel,
    itemById,
    md,
    mdInline,
    mdStrip,
  }
}
