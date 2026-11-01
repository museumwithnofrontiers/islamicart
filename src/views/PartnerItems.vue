<script setup>
import { computed } from 'vue'
import { removeEndingPoint, useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { StandalonePagination, StandaloneResultsGrid } from '@museumwnf/viewer-layout/standalone'
import { PROJECTS } from '../dataset.config.js'
import { useData } from '../composables/data.js'
import { exploreOnly, partnerItemsSpec } from '../composables/partner.js'

// A partner's objects or monuments as legacy's pm_museum_items.php and
// pm_institution_items.php: the way back, the partner's name with its city
// and country, the Permanent Collection's tiles with "Partner Profile"
// beside them, and legacy's pages under both. Every word is legacy's own
// (islamicart.pmi.*, islamicart.pcr.*, its translation table).

const props = defineProps({ id: { type: String, required: true } })

const { t, locale } = useI18n()
const { countryLabel, partnerById, tr } = useData()

const partner = computed(() => partnerById.value.get(props.id) ?? null)
const spec = computed(() => partnerItemsSpec(props.id, partner.value?.type))
const text = computed(() => tr('partners', props.id))
// "Rome, Italy": the city, then the country in the page's language.
const place = computed(() =>
  [removeEndingPoint(text.value.city ?? ''), partner.value?.country_id ? countryLabel(partner.value.country_id) : '']
    .filter(Boolean)
    .join(', '),
)

const list = (type, project) => ({ name: 'partners-results', query: { type, project, lang: locale.value } })
// Legacy's links back, for the list the partner is reached from. Its
// Sponsors page and Explore's per-country list are not built yet: those
// two links wait for them.
const backLinks = computed(() =>
  exploreOnly(partner.value)
    ? [{ label: 'islamicart.pmi.allCountries', to: list('museum', PROJECTS.explore) }]
    : [
        { label: 'islamicart.pmi.partnerMuseums', to: list('museum', PROJECTS.discover) },
        { label: 'islamicart.pmi.otherPartners', to: list('institution', PROJECTS.discover) },
      ],
)
</script>

<template>
  <CatalogueResultsView :spec="spec" class="islamicart-pcr islamicart-pmi">
    <template #before>
      <p class="mwnf-standalone-item__back islamicart-pcr__back">
        <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('islamicart.pcr.back') }}</button>
        <RouterLink v-for="link in backLinks" :key="link.label" class="mwnf-standalone-item__back-link" :to="link.to">{{ t(link.label) }}</RouterLink>
      </p>
      <div class="islamicart-pmi__heading">
        <h3 class="islamicart-pcr__heading">{{ removeEndingPoint(text.name ?? partner?.internal_name ?? '') }}</h3>
        <p><i>{{ place }}</i></p>
      </div>
    </template>

    <template #records="{ rows, empty }">
      <StandaloneResultsGrid :rows="rows" :see-label="t('islamicart.pcr.see')" :empty="empty" />
    </template>

    <!-- Legacy's pages run under both columns: drawn after them. -->
    <template #pagination></template>

    <template #aside>
      <div class="islamicart-pcr__related">
        <p><RouterLink :to="{ name: 'partner', params: { id }, query: { lang: locale } }">{{ t('islamicart.pmi.profile') }}</RouterLink></p>
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
