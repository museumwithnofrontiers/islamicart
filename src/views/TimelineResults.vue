<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { StandaloneTimelineResults } from '@museumwnf/viewer-layout/standalone'
import {
  EVENTS_PAGE_SIZE, dateOptions, eventRow, findEvents, galleryItems, resultCountries, searchLine, timelineQuery, timelineSearch,
  wordFile, wordLine,
} from '../composables/timeline.js'

// The Timeline results as legacy's hcr_result.php, the standalone family's
// (viewer-layout's `StandaloneTimelineResults`): the band with the search in
// words and its three lists, which search again as soon as one changes; the
// events, fifteen a page; "See Gallery" when the period has records; the
// downloads. Every word is legacy's own (islamicart.tl.*); the alerts are
// the ones legacy's page script wrote, in English.

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const search = computed(() => timelineSearch(route.query))
const events = computed(() => findEvents(search.value))
const page = computed(() => Math.min(Math.max(1, Number(route.query.page) || 1), Math.max(1, Math.ceil(events.value.length / EVENTS_PAGE_SIZE))))
const rows = computed(() => events.value.slice((page.value - 1) * EVENTS_PAGE_SIZE, page.value * EVENTS_PAGE_SIZE).map((event) => eventRow(event, t)))
const pageInfo = computed(() => ({ currentPage: page.value, lastPage: Math.ceil(events.value.length / EVENTS_PAGE_SIZE) }))

const dates = computed(() => dateOptions(t))
const query = computed(() => timelineQuery(route.query))
const selects = computed(() => [
  { key: 'start', label: t('islamicart.tl.startDate'), value: String(query.value.start), options: [{ value: 'none', label: t('islamicart.tl.startDate') }, ...dates.value.starts] },
  { key: 'end', label: t('islamicart.tl.endDate'), value: String(query.value.end), options: [{ value: 'none', label: t('islamicart.tl.endDate') }, ...dates.value.ends] },
  {
    key: 'country',
    label: t('islamicart.tl.country'),
    value: query.value.country,
    options: [{ value: 'none', label: t('islamicart.tl.selectCountry') }, { value: '', label: t('islamicart.tl.allCountries') }, ...resultCountries()],
  },
])

// Legacy's selectCountry() and selectTimePeriod(): what a change must leave
// for the page to search again, said in legacy's alerts.
function problem(next) {
  const dated = next.start !== 'none' && next.end !== 'none'
  if (next.country === 'none') return t('islamicart.tl.alertCountry')
  if (next.country === '' && !dated) return t('islamicart.tl.alertCountryOrDates')
  if (dated && Number(next.start) > Number(next.end)) return t('islamicart.tl.alertPeriod')
  return ''
}
function change({ key, value }) {
  const next = { ...query.value, [key]: value }
  const message = problem(next)
  if (message) {
    window.alert(message)
    return
  }
  router.push({ name: 'timeline-results', query: { ...next, lang: route.query.lang } })
}
function navigate(to) {
  router.push({ name: 'timeline-results', query: { ...route.query, page: String(to) } })
}

const related = computed(() =>
  galleryItems(search.value).length
    ? {
        heading: t('islamicart.tl.related'),
        gallery: {
          label: t('islamicart.tl.seeGallery'),
          title: t('islamicart.tl.galleryTooltip'),
          to: { name: 'timeline-gallery', query: { ...query.value, lang: route.query.lang } },
        },
      }
    : null,
)
const download = computed(() => ({
  heading: t('islamicart.tl.download'),
  pdf: t('islamicart.tl.pdf'),
  word: t('islamicart.tl.word'),
  title: 'MWNF - Discover Islamic Art',
  line: wordLine(search.value, t, locale.value),
  file: wordFile(search.value, locale.value),
}))
const back = computed(() => [
  { label: t('islamicart.tl.back'), history: true },
  { label: t('islamicart.tl.startPage'), to: { name: 'timeline', query: { lang: route.query.lang } } },
])
</script>

<template>
  <StandaloneTimelineResults
    :heading="t('islamicart.tl.title')"
    :summary="searchLine(search, t, locale)"
    :selects="selects"
    :back="back"
    :heads="{ date: t('islamicart.tl.date'), countryDescription: `${t('islamicart.tl.country')} | ${t('islamicart.tl.description')}` }"
    :rows="rows"
    :all="events.map((event) => eventRow(event, t))"
    :empty="t('islamicart.tl.empty')"
    :page-info="pageInfo"
    :previous-label="t('islamicart.tl.previous')"
    :next-label="t('islamicart.tl.next')"
    :related="related"
    :download="download"
    @change="change"
    @navigate="navigate"
  />
</template>
