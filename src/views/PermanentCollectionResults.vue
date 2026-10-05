<script setup>
import { useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { permanentCollectionResultsSpec } from '../composables/catalogue.js'

// The Permanent Collection list is the platform's composed results page,
// rendering the spec in composables/catalogue.js. What is this website's is
// the heading: the section's name with the active filter as a suffix, which
// legacy printed and no other website does.

const { t } = useI18n()
const { countryLabel, dynastyLabel, partnerLabel } = useData()

// Null when nothing is filtered, so the suffix depends on the absence of a
// filter rather than on a comparison against a text.
function activeFilterLabel(filters) {
  if (filters.country) return countryLabel(filters.country)
  if (filters.dynasty) return dynastyLabel(filters.dynasty)
  if (filters.partner) return partnerLabel(filters.partner)
  if (filters.begin) return `${t('catalogue.filter.from')} ${filters.begin}`
  if (filters.end) return `${t('catalogue.filter.upTo')} ${filters.end}`
  return null
}
</script>

<template>
  <CatalogueResultsView :spec="permanentCollectionResultsSpec" class="permanent-collection">
    <template #before="{ filters }">
      <h1 class="mwnf-heading">
        {{ $t('standalone.nav.permanentCollection') }}
        <span v-if="activeFilterLabel(filters)" class="heading-filter"> — {{ activeFilterLabel(filters) }}</span>
      </h1>
    </template>
  </CatalogueResultsView>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--mwnf-color-muted); }
</style>
