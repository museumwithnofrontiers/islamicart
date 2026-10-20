<script setup>
import { computed } from 'vue'
import { mdInline, removeEndingPoint } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { itemRecord } from '../composables/catalogue.js'
import { useDynasties } from '../composables/dynasties.js'

// A dynasty's objects or monuments, as legacy's client listed them
// ("42 Related Objects for Umayyads of al-Andalus", a thumbnail beside each one's lines,
// paged): the platform's results view, scoped to the dynasty and the type.
const props = defineProps({
  id: { type: String, required: true },
  kind: { type: String, required: true },
})
const { textOf, recordsOf } = useDynasties()

const type = computed(() => (props.kind === 'monuments' ? 'monument' : 'object'))
const name = computed(() => mdInline(removeEndingPoint(textOf(props.id).name ?? '')))
const count = computed(() => recordsOf(props.id, type.value).length)

const spec = computed(() => ({
  entity: 'items',
  keys: [],
  facets: {},
  scope: (item) => item.type === type.value && (item.dynasty_ids ?? []).includes(props.id),
  sort: 'chronological',
  pageSize: 20,
  variant: 'list',
  boxed: true,
  recordRoute: 'item',
  record: itemRecord,
  pagination: { window: 7 },
}))
</script>

<template>
  <div class="dynasty-related">
    <p class="mwnf-standalone-item__back">
      <RouterLink class="mwnf-standalone-item__back-link" :to="{ name: 'dynasty', params: { id } }">{{ $t('islamicart.item.back') }}</RouterLink>
      <RouterLink class="mwnf-standalone-item__back-link" :to="{ name: 'dynasties' }">{{ $t('islamicart.dynasties.startPage') }}</RouterLink>
    </p>
    <CatalogueResultsView :key="`${id}-${kind}`" :spec="spec">
      <template #before>
        <h1 class="dynasty-related__heading">
          {{ count }} {{ type === 'monument' ? $t('islamicart.dynasties.relatedMonumentsFor') : $t('islamicart.dynasties.relatedObjectsFor') }}
          <strong v-html="name"></strong>
        </h1>
      </template>
    </CatalogueResultsView>
  </div>
</template>

<style scoped>
.dynasty-related { padding-block: 20px 30px; }
.dynasty-related__heading { font-size: 16px; font-weight: 400; margin: 0 0 12px; }
</style>
