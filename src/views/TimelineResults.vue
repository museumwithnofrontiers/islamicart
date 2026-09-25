<script setup>
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { TimelineResultsView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { timelineResults } from '../composables/timeline.js'

// The timeline results is the platform's composed timeline view, rendering
// the results spec in composables/timeline.js. What is this website's is
// the heading — the section's name with the active filter as a suffix,
// which legacy printed and no other website does — and the way back to the
// entrance.

const route = useRoute()
const { t } = useI18n()
const { countryLabel } = useData()

// Null when nothing is filtered, so the suffix depends on the absence of a
// filter rather than on a comparison against a text that changes with the
// language.
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
    <RouterLink :to="{ name: 'timeline' }" class="mwnf-back-bar mwnf-back-bar--link">‹ {{ $t('timeline.nav.backLink') }}</RouterLink>

    <h1 class="mwnf-heading">
      {{ $t('islamicart.nav.timeline') }}
      <span v-if="activeFilterLabel()" class="heading-filter"> — {{ activeFilterLabel() }}</span>
    </h1>

    <div class="mwnf-panel">
      <TimelineResultsView :spec="timelineResults" />
    </div>
  </div>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
</style>
