<script setup>
import { computed } from 'vue'
import { useFacets, I18nText } from '@museumwnf/viewer-core'
import { SearchFormView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { FACETS } from '../composables/catalogue.js'
import { permanentCollectionSearchSpec } from '../composables/search.js'

// The Permanent Collection entrance is the platform's composed search form,
// rendering the spec in composables/search.js. What is this website's is the
// heading, the intro paragraph, and the facet options themselves — the
// values the records actually carry, the same derivation the results page's
// own filter panel uses (composables/catalogue.js's FACETS).

const { items } = useData()
const options = useFacets(items, FACETS)
const spec = computed(() => permanentCollectionSearchSpec(options.value))
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('standalone.nav.permanentCollection') }}</h1>

    <div class="mwnf-panel">
      <SearchFormView :spec="spec">
        <template #intro>
          <I18nText tag="p" class="intro-text" keypath="standalone.permanentCollection.intro" />
        </template>
      </SearchFormView>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
}
</style>
