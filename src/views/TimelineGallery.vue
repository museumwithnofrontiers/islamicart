<script setup>
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { BackLink } from '@museumwnf/viewer-layout/content'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { timelineGallerySpec } from '../composables/timeline.js'

// Decision D1: the timeline gallery of objects legacy served from
// `hcr_gallery.php`, regained as the platform's composed results page,
// rendering the spec in composables/timeline.js. What is this website's is
// the heading — the section's name with the country/period it was reached
// with — and the way back to the timeline results that linked here.

const route = useRoute()
const { t } = useI18n()
const { countryLabel } = useData()

function activeFilterLabel() {
  const { country, begin, end } = route.query
  const parts = []
  if (country && country !== 'all') parts.push(countryLabel(country))
  if (begin) parts.push(`${t('catalogue.filter.from')} ${begin}`)
  if (end) parts.push(`${t('catalogue.filter.to')} ${end}`)
  return parts.length ? parts.join(' — ') : null
}
</script>

<template>
  <div>
    <!-- Reached only from the timeline results' "See gallery" link, never a
         nav entry of its own: back to the results it came from. -->
    <BackLink variant="bar" arrow="‹" label="timeline.nav.backLink" :to="{ name: 'timeline-results', query: $route.query }" />

    <h1 class="mwnf-heading">
      {{ $t('timeline.results.galleryHeading') }}
      <span v-if="activeFilterLabel()" class="heading-filter"> — {{ activeFilterLabel() }}</span>
    </h1>

    <CatalogueResultsView :spec="timelineGallerySpec" class="timeline-gallery" />
  </div>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
.timeline-gallery :deep(.mwnf-catalogue__filters) { margin-bottom: 16px; }
.timeline-gallery :deep(.mwnf-catalogue__body) {
  background: var(--content-bg);
  border: 1px solid var(--border);
  padding: 20px;
  margin-bottom: 16px;
}
</style>
