<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { StandalonePagination, StandaloneResultsGrid } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { gallerySpec, timelineQuery, timelineSearch, yearLabel } from '../composables/timeline.js'

// The Timeline gallery as legacy's hcr_gallery.php, the standalone family's
// results page (viewer-layout's `mwnf-standalone-pcr`, as the partner's
// objects are drawn): the way back, the search in words with "Gallery", the
// Permanent Collection's tiles with "See Timeline" and the country beside
// them, and legacy's pages under both. Every word is legacy's own
// (islamicart.tl.*, islamicart.pcr.*).

const route = useRoute()
const { t } = useI18n()
const { countryLabel } = useData()

const search = computed(() => timelineSearch(route.query))
const spec = computed(() => gallerySpec(search.value))
const country = computed(() => (search.value.country ? countryLabel(search.value.country) : ''))

// "Timeline | 1000 A.D. to 1200 A.D. | Egypt | Gallery", its first and last words bold.
const title = computed(() => [
  yearLabel(t, search.value.start) + ' to ' + yearLabel(t, search.value.end),
  country.value,
].filter(Boolean).join(' | '))

const back = computed(() => [
  { label: t('islamicart.tl.back'), history: true },
  { label: t('islamicart.tl.startPage'), to: { name: 'timeline', query: { lang: route.query.lang } } },
])
const results = computed(() => ({ name: 'timeline-results', query: { ...timelineQuery(route.query), lang: route.query.lang } }))
</script>

<template>
  <CatalogueResultsView :spec="spec" class="mwnf-standalone-pcr mwnf-standalone-pmi">
    <template #before="{ matching }">
      <p class="mwnf-standalone-item__back mwnf-standalone-pcr__back">
        <template v-for="link in back" :key="link.label">
          <button v-if="link.history" type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ link.label }}</button>
          <RouterLink v-else class="mwnf-standalone-item__back-link" :to="link.to">{{ link.label }}</RouterLink>
        </template>
      </p>
      <h3 v-if="matching?.length" class="mwnf-standalone-pcr__heading">
        <b>{{ t('islamicart.tl.title') }}</b> | {{ title }} | <b>{{ t('islamicart.tl.gallery') }}</b>
      </h3>
    </template>

    <template #records="{ rows, empty }">
      <StandaloneResultsGrid :rows="rows" :see-label="t('islamicart.pcr.see')" :empty="empty" />
    </template>

    <template #pagination></template>

    <template #aside>
      <div class="mwnf-standalone-pcr__related">
        <p><RouterLink :to="results">{{ t('islamicart.tl.seeTimeline') }}&nbsp;{{ country }}</RouterLink></p>
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
