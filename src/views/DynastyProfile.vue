<script setup>
import { computed } from 'vue'
import { md, mdInline, removeEndingPoint } from '@museumwnf/viewer-core'
import { RelatedContent } from '@museumwnf/viewer-layout/standalone'
import { useDynasties } from '../composables/dynasties.js'

// A dynasty's profile, as legacy's client draws it: the way back, the name,
// "Also known as", the date line, the area in italics and the history; in the
// Related Content column, its objects and monuments, the timeline of its
// period, and the Artistic Introduction.
//
// Legacy's client also linked one Artistic Introduction theme and the
// exhibitions of some dynasties; the data package carries neither link, so
// the column links the Artistic Introduction itself and no exhibitions.
const props = defineProps({ id: { type: String, required: true } })
const { dynasties, textOf, dateLine, recordsOf } = useDynasties()

const dynasty = computed(() => (dynasties.value ?? []).find((d) => d.id === props.id) ?? null)
const text = computed(() => (dynasty.value ? textOf(dynasty.value.id) : {}))
const objects = computed(() => recordsOf(props.id, 'object').length)
const monuments = computed(() => recordsOf(props.id, 'monument').length)
const timeline = computed(() => {
  const d = dynasty.value
  if (!d || d.from_ad == null) return null
  const query = { country: 'all', begin: String(d.from_ad) }
  if (d.to_ad != null) query.end = String(d.to_ad)
  return { name: 'timeline-results', query }
})

function goBack() {
  window.history.back()
}
</script>

<template>
  <div v-if="dynasty" class="dynasty">
    <div class="dynasty__main">
      <p class="mwnf-standalone-item__back">
        <button type="button" class="mwnf-standalone-item__back-link" @click="goBack">{{ $t('islamicart.item.back') }}</button>
        <RouterLink class="mwnf-standalone-item__back-link" :to="{ name: 'dynasties' }">{{ $t('islamicart.dynasties.startPage') }}</RouterLink>
      </p>
      <p class="dynasty__name">
        <strong v-html="mdInline(removeEndingPoint(text.name ?? ''))"></strong>
        <template v-if="text.also_known_as"><br />{{ $t('islamicart.home.alsoKnownAs') }} <span v-html="mdInline(text.also_known_as)"></span></template>
      </p>
      <p class="dynasty__when">
        <template v-if="dateLine(text)">{{ dateLine(text) }}<br /></template>
        <i v-if="text.area" v-html="mdInline(text.area)"></i>
      </p>
      <div v-if="text.history" class="dynasty__history" v-html="md(text.history)"></div>
    </div>

    <RelatedContent heading="islamicart.item.relatedContent" :records="[]">
      <ul class="dynasty__links">
        <li v-if="objects">
          <RouterLink :to="{ name: 'dynasty-related', params: { id, kind: 'objects' } }">{{ $t('islamicart.item.relatedObjects') }}</RouterLink>
        </li>
        <li v-if="monuments">
          <RouterLink :to="{ name: 'dynasty-related', params: { id, kind: 'monuments' } }">{{ $t('islamicart.item.relatedMonuments') }}</RouterLink>
        </li>
        <li v-if="timeline"><RouterLink :to="timeline">{{ $t('islamicart.nav.timeline') }}</RouterLink></li>
        <li><RouterLink :to="{ name: 'artistic-introduction' }">{{ $t('islamicart.nav.artisticIntroduction') }}</RouterLink></li>
      </ul>
    </RelatedContent>
  </div>
</template>

<style scoped>
.dynasty {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 40px;
  font-size: 14px;
}
.dynasty__main { padding-block: 20px 30px; }
.dynasty__name strong { font-weight: 500; }
.dynasty__links { margin: 0; padding: 0; list-style: none; }
.dynasty__links li { margin-bottom: 4px; }
@media (max-width: 48rem) {
  .dynasty { grid-template-columns: 1fr; }
}
</style>
