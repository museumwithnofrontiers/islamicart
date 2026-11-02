<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { StandalonePagination, StandaloneRefine, StandaloneResultsList } from '@museumwnf/viewer-layout/standalone'
import { databaseResultsSpec, databaseSearch } from '../composables/search.js'

// The database results as legacy's database_results.php: the "Refine your
// search" band, the way back, the heading with the count, the records two
// to a row beside the preview of the one hovered, and legacy's pages — the
// standalone family's search results page (viewer-layout's
// `mwnf-standalone-dbr`). The query, the search and the pages are
// viewer-layout's `CatalogueResultsView` (composables/search.js's spec);
// every word is legacy's own (islamicart.dbr.*, its translation table).
// The page waits for the search's translations: every language is
// searched, so the count is drawn once they are all there.

const { t, locale } = useI18n()
const { prepare, ready } = databaseSearch
prepare()

// Legacy's refine list: the entrance's fields but "Other".
const refineFields = computed(() => [
  { value: 'keyword', label: t('islamicart.dbField.keyword') },
  { value: 'name', label: t('islamicart.dbField.name') },
  { value: 'location', label: t('islamicart.dbField.location') },
  { value: 'provenance', label: t('islamicart.dbField.provenance') },
  { value: 'dynasty', label: t('islamicart.dbField.dynasty') },
  { value: 'patron', label: t('islamicart.dbField.patron') },
  { value: 'artist', label: t('islamicart.dbField.artist') },
  { value: 'material', label: t('islamicart.dbField.material') },
])

// Legacy printed "New search" through PHP's ucwords().
const ucwords = (text) => text.replace(/(^|\s)(\S)/g, (match, space, letter) => space + letter.toUpperCase())

// Search within the results: one more keyword, in its field, and-ed to them.
const refine = (apply, { keyword, field }) => apply({ q4: keyword, field4: field, op4: 'AND' })

const newSearch = computed(() => ({ name: 'database', query: { lang: locale.value } }))
</script>

<template>
  <CatalogueResultsView v-if="ready" :spec="databaseResultsSpec" class="mwnf-standalone-pcr mwnf-standalone-dbr">
    <template #before="{ apply, matching }">
      <StandaloneRefine
        :label="`${t('islamicart.dbr.refine')}:`"
        :in-label="t('islamicart.db.in')"
        :fields="refineFields"
        :search-label="t('islamicart.dbr.search')"
        :new-search-label="ucwords(t('islamicart.dbr.newSearch'))"
        :new-search="newSearch"
        @search="refine(apply, $event)"
      />
      <p class="mwnf-standalone-item__back mwnf-standalone-pcr__back">
        <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('islamicart.pcr.back') }}</button>
        <RouterLink class="mwnf-standalone-item__back-link" :to="newSearch">{{ t('islamicart.dbr.startPage') }}</RouterLink>
      </p>
      <h3 class="mwnf-standalone-pcr__heading">{{ t('islamicart.dbr.title') }} | {{ matching.length }}&nbsp;{{ t('islamicart.dbr.records') }}</h3>
    </template>

    <template #records="{ rows }">
      <StandaloneResultsList :rows="rows" :empty="t('islamicart.dbr.empty')" />
    </template>

    <!-- Legacy's pages run under both columns: drawn after them. -->
    <template #pagination></template>

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
