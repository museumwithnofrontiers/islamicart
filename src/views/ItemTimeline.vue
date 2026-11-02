<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { removeEndingPoint, useI18n } from '@museumwnf/viewer-core'
import { StandaloneHistoricalCrossRef } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { eventRow, findEvents, itemTimelineSearch, rangeOptions, resultCountries, yearLabel } from '../composables/timeline.js'

// Legacy's Historical Cross Referencing window (hcr.php, "Timeline for this
// item"), opened from the item sheet: the standalone family's window
// (viewer-layout's `StandaloneHistoricalCrossRef`) with the item's country
// and period, legacy's lists to look at another country or century, the
// item, and that country's events of the period. Every word is legacy's own
// (islamicart.tl.*, islamicart.hcr.*); the window stays left to right in
// Arabic, as legacy's did.

const props = defineProps({ id: { type: String, required: true } })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { countryLabel, items, mdInline, tr } = useData()

const item = computed(() => (items.value ?? []).find((record) => record.id === props.id) ?? null)
const search = computed(() => itemTimelineSearch(item.value, route.query))

const plain = (value) => removeEndingPoint(String(value ?? '').replace(/[\r\n]/g, ' ')).trim()

// The item as legacy's window showed it: its name; its date and dynasty, a
// blank line, its holder, then its location, province and country.
const shown = computed(() => {
  if (!item.value) return null
  const text = tr('items', item.value.id)
  const place = [plain(text.location), plain(text.province), item.value.country_id ? countryLabel(item.value.country_id) : '']
    .filter(Boolean)
    .join(', ')
  return {
    image: item.value.images?.[0]?.url ?? '',
    name: mdInline(plain(text.name ?? item.value.internal_name)),
    lines: [[plain(text.dates), plain(text.dynasty)].filter(Boolean).join(', '), '', plain(text.holder), place],
  }
})

const labels = computed(() => ({
  heading: t('islamicart.tl.title'),
  close: t('record.glossary.close'),
  country: t('islamicart.hcr.country'),
  range: t('islamicart.hcr.range'),
}))
const heading = computed(() =>
  `${search.value.country ? countryLabel(search.value.country) : ''} - ${yearLabel(t, `${search.value.start} - ${search.value.end}`)}`,
)
const events = computed(() => findEvents(search.value).map((event) => eventRow(event, t)))

function change({ key, value }) {
  const query = { ...route.query, [key]: value }
  // Legacy's form sent the time range with the country: a new country keeps the period shown.
  if (key === 'country') query.start = String(search.value.start)
  router.replace({ query })
}
</script>

<template>
  <StandaloneHistoricalCrossRef
    :labels="labels"
    :start="search.start"
    :end="search.end"
    :countries="resultCountries()"
    :country="search.country"
    :ranges="rangeOptions(search, t)"
    :range="search.start"
    :item="shown"
    :heading="heading"
    :events="events"
    dir="ltr"
    @change="change"
  />
</template>
