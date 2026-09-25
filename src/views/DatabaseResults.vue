<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSearchFieldOptions } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { SEARCH_FIELDS } from '../composables/catalogue.js'
import { databaseResults } from '../composables/search.js'

// The database results is the platform's composed catalogue results view,
// rendering the spec in composables/search.js. What is this website's is
// the heading, the search-language translations watch (a side effect the
// spec itself has no lifecycle to run), and the refine row's field/operator
// selects — not a record facet the view can derive options for itself.

const route = useRoute()
const { loadTranslations } = useData()
const fieldOptions = useSearchFieldOptions(SEARCH_FIELDS)

// The search language is read straight off the URL, not the composed
// view's own staged filters, so a language chosen on the entrance loads
// before this page's first render rather than after an Apply click.
watch(() => route.query.lang, (lang) => { if (lang) loadTranslations('items', lang) }, { immediate: true })
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('islamicart.nav.database') }} — {{ $t('catalogue.results.heading') }}</h1>

    <div class="mwnf-panel">
      <CatalogueResultsView :spec="databaseResults">
        <template #actions>
          <RouterLink :to="{ name: 'database' }" class="mwnf-button mwnf-button--secondary small">{{ $t('catalogue.search.newSearch') }}</RouterLink>
        </template>

        <template #filters="{ filters }">
          <select v-model="filters.field4" class="mwnf-select field">
            <option v-for="f in fieldOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
          <select v-model="filters.op4" class="mwnf-select cond">
            <option value="AND">{{ $t('catalogue.search.and') }}</option>
            <option value="OR">{{ $t('catalogue.search.or') }}</option>
          </select>
        </template>

        <template #empty>
          {{ $t('catalogue.results.noResultsSearch') }}
          <RouterLink :to="{ name: 'database' }">{{ $t('catalogue.search.tryNewSearch') }}</RouterLink>
        </template>
      </CatalogueResultsView>
    </div>
  </div>
</template>

<style scoped>
/* The kit has no compact button size, so this page's "New search" action
   (beside the results, not a full-width form action) keeps its own. */
.mwnf-button.small { font-size: 12px; padding: 4px 12px; text-decoration: none; }
/* `.mwnf-select` is a full-width form control; the refine row's two selects
   sit inline beside each other instead, so only their width is this page's
   own. */
.field { width: 200px; }
.cond { width: 60px; margin-left: 8px; }
</style>
