<script setup>
import { computed } from 'vue'
import { useFacets, useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { StandalonePagination, StandaloneResultsGrid } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { FACETS, centuries, dateWindow, inScope, permanentCollectionResultsSpec } from '../composables/catalogue.js'

// The Permanent Collection results as legacy's pclist_all.php: the way back,
// the heading naming the selection and its count, legacy's tiles with
// "Change your selection" and "Related Content" beside them, and legacy's
// pages under both. The query, the filters and the pages are viewer-layout's
// `CatalogueResultsView` (composables/catalogue.js's spec); every word is
// legacy's own (islamicart.pcr.*, its translation table).

const { t, locale } = useI18n()
const { items, countryLabel, dynastyLabel, partnerLabel } = useData()

const options = useFacets(items, FACETS)
const byLabel = (list) => [...(list ?? [])].sort((a, b) => a.label.localeCompare(b.label, locale.value))
// Legacy listed the countries of the objects only, by name.
const countries = computed(() => {
  const ids = new Set((items.value ?? []).filter((i) => i.type === 'object' && inScope(i, true)).map((i) => i.country_id))
  return byLabel((options.value.country ?? []).filter((o) => ids.has(o.value)))
})
const dynasties = computed(() => byLabel(options.value.dynasty))

// Legacy's "[DATE] A.D.": the year, then the era's own word.
const ad = (year) => `${year} ${t('islamicart.pc.ad')}`

// "Permanent Collection | Italy", "| 400 A.D. to 2000 A.D." (legacy's
// French and Spanish put a `datefrom` word first, which its table never
// filled).
function selection(filters) {
  const parts = []
  if (filters.country) parts.push(countryLabel(filters.country))
  if (filters.dynasty) parts.push(dynastyLabel(filters.dynasty))
  if (filters.partner) parts.push(partnerLabel(filters.partner))
  const window = dateWindow(filters)
  if (window) parts.push(`${ad(window.begin)} ${t('islamicart.pcr.to').toLowerCase()} ${ad(window.end)}`)
  return parts.filter(Boolean)
}

// "[107 Objects, 18 Monuments]", each part only when it counts something.
function count(matching) {
  const monuments = matching.filter((item) => item.type === 'monument').length
  const objects = matching.length - monuments
  const parts = []
  if (objects) parts.push(`${objects} ${t('islamicart.pcr.objects')}`)
  if (monuments) parts.push(`${monuments} ${t('islamicart.pcr.monuments')}`)
  return parts.length ? `[${parts.join(', ')}]` : ''
}

// What a list shows as picked: the filter, or for a date the window's.
const isDate = (key) => key === 'begin' || key === 'end'
const picked = (filters, key) => (isDate(key) ? dateWindow(filters)?.[key] ?? '' : filters[key] || '')

// Legacy's lists replaced the selection: a country or a dynasty alone, or
// both dates together; a start after the end is not taken.
function choose(event, apply, filters, key) {
  const value = event.target.value
  const next = { country: '', dynasty: '', partner: '', begin: '', end: '' }
  if (isDate(key) && value) Object.assign(next, dateWindow({ begin: filters.begin, end: filters.end, [key]: value }))
  else next[key] = value
  if (!value || Number(next.begin) > Number(next.end)) {
    event.target.value = picked(filters, key)
    return
  }
  apply(next)
}

const timelineLink = (country) => ({ name: 'timeline-results', query: { country, lang: locale.value } })
</script>

<template>
  <CatalogueResultsView :spec="permanentCollectionResultsSpec" class="islamicart-pcr">
    <template #before="{ filters, matching }">
      <p class="mwnf-standalone-item__back islamicart-pcr__back">
        <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('islamicart.pcr.back') }}</button>
        <RouterLink class="mwnf-standalone-item__back-link" :to="{ name: 'permanent-collection', query: { lang: locale } }">{{ t('islamicart.pcr.startPage') }}</RouterLink>
      </p>
      <h3 class="islamicart-pcr__heading">
        {{ t('islamicart.pcr.title') }}<template v-for="part in selection(filters)" :key="part"> | <b>{{ part }}</b></template>
        <template v-if="count(matching)">{{ ' ' }}<span class="islamicart-pcr__count">{{ count(matching) }}</span></template>
      </h3>
    </template>

    <template #records="{ rows, empty }">
      <StandaloneResultsGrid :rows="rows" :see-label="t('islamicart.pcr.see')" :empty="empty" />
    </template>

    <!-- Legacy's pages run under both columns: drawn after them. -->
    <template #pagination></template>

    <template #aside="{ filters, apply }">
      <form class="islamicart-pcr__panel" @submit.prevent>
        <p>
          <strong>{{ t('islamicart.pcr.changeSelection') }}</strong>
          <select :value="picked(filters, 'country')" @change="choose($event, apply, filters, 'country')">
            <option value="">{{ t('islamicart.pc.country') }}</option>
            <option v-for="o in countries" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <select :value="picked(filters, 'dynasty')" @change="choose($event, apply, filters, 'dynasty')">
            <option value="">{{ t('islamicart.sheet.periodDynasty') }}</option>
            <option v-for="o in dynasties" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </p>
        <p class="islamicart-pcr__dates">
          <span class="islamicart-pcr__date">
            <select :value="picked(filters, 'begin')" @change="choose($event, apply, filters, 'begin')">
              <option value="">{{ t('islamicart.pc.startDate') }}</option>
              <option v-for="c in centuries" :key="c" :value="String(c)">{{ ad(c) }}</option>
            </select>
          </span>
          <span class="islamicart-pcr__date">
            <select :value="picked(filters, 'end')" @change="choose($event, apply, filters, 'end')">
              <option value="">{{ t('islamicart.pc.endDate') }}</option>
              <option v-for="c in centuries" :key="c" :value="String(c + 100)">{{ ad(c + 100) }}</option>
            </select>
          </span>
        </p>
      </form>
      <div v-if="filters.country" class="islamicart-pcr__related">
        <p><strong>{{ t('islamicart.pcr.related') }}</strong></p>
        <p><RouterLink :to="timelineLink(filters.country)">{{ t('islamicart.pcr.timeline') }} | {{ countryLabel(filters.country) }}</RouterLink></p>
      </div>
    </template>

    <template #after="{ pageInfo, goToPage }">
      <StandalonePagination
        :page-info="pageInfo"
        :previous-label="t('islamicart.pcr.previous')"
        :next-label="t('islamicart.pcr.next')"
        @navigate="goToPage"
      />
    </template>
  </CatalogueResultsView>
</template>
