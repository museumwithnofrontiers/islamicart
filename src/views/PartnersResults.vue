<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n, useProjects } from '@museumwnf/viewer-core'
import { PartnerListView } from '@museumwnf/viewer-layout/views'
import { PROJECTS } from '../dataset.config.js'
import { partnersResultsSpec } from '../composables/partner.js'

// The partner results page is the platform's composed partner list,
// rendering the spec in composables/partner.js. What is this website's is
// the heading — the type and project the entrance's own link chose — and
// the toggle between museums and institutions.

const route = useRoute()
const { t } = useI18n()
const { label: projectName } = useProjects()

const filterType = computed(() => (route.query.type === 'institution' ? 'institution' : 'museum'))
const otherType = computed(() => (filterType.value === 'museum' ? 'institution' : 'museum'))

const knownProjects = new Set(Object.values(PROJECTS))

// 'Discover Islamic Art' and 'Explore Islamic Art Collections' are two
// entirely separate curated lists in legacy — never merged into one, unlike
// Permanent Collection/Database — each reached from the entrance's own link
// (PartnersEntrance.vue), which always sends one of `dataset.config.js`'s
// `PROJECTS`; anything else falls back to the primary project.
const project = computed(() => (knownProjects.has(route.query.project) ? route.query.project : PROJECTS.discover))

const spec = computed(() => partnersResultsSpec(filterType.value, project.value))

// Both branches spell their own name in full, for the same reason the spec
// factory's do.
const typeHeading = computed(() =>
  filterType.value === 'museum' ? t('partner.list.museums') : t('partner.list.institutions')
)
// The project's own name, from the data package's manifest — not a site text.
const projectLabel = computed(() => projectName(project.value))
const otherTypeLabel = computed(() =>
  otherType.value === 'museum' ? t('standalone.partner.viewMuseums') : t('standalone.partner.viewInstitutions')
)
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'partners' }" class="mwnf-back-bar mwnf-back-bar--link">‹ {{ $t('partner.nav.back') }}</RouterLink>

    <h1 class="mwnf-heading">
      {{ typeHeading }}
      <span class="heading-project"> — {{ projectLabel }}</span>
    </h1>

    <div class="mwnf-panel">
      <p class="other-type">
        <RouterLink :to="{ path: '/partners/results', query: { type: otherType, project } }">
          {{ otherTypeLabel }}
        </RouterLink>
      </p>

      <PartnerListView :spec="spec" />
    </div>
  </div>
</template>

<style scoped>
.heading-project { font-weight: normal; font-size: 14px; color: var(--muted); }

.other-type {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
</style>
