<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BackLink } from '@museumwnf/viewer-layout/content'
import { EssayView } from '@museumwnf/viewer-layout/views'
import { artIntroTree } from '../composables/artIntro.js'
import { artIntroThemeSpec } from '../composables/artIntroSpecs.js'

// A theme's page: an `EssayView` over the page node — `tabs: true` for the
// Monuments/Objects-style strip legacy fixed at two, `navigation:
// 'siblings'` to stay within the theme (Artistic Introduction never walked
// from one theme into the next — no cross-theme previous/next here, unlike
// Exhibitions). `?tab` in the query picks which page, same key legacy
// used; absent, this lands on the theme's first page. One instance of the
// tree for the whole site (composables/artIntro.js), so — unlike
// Exhibitions' per-exhibition tree — this component never needs to remount
// when the address changes.
const route = useRoute()
const spec = artIntroThemeSpec(artIntroTree)

const themeId = computed(() => decodeURIComponent(route.params.themeId))
const pages = computed(() => artIntroTree.children(themeId.value))
const activeId = computed(() => {
  const list = pages.value
  const idx = Number.parseInt(route.query.tab ?? '0', 10)
  const page = Number.isFinite(idx) && idx >= 0 && idx < list.length ? list[idx] : list[0]
  return page?.id ?? themeId.value
})
</script>

<template>
  <div class="theme-wrap">
    <BackLink variant="bar" label="islamicart.artIntro.backLink" :to="{ name: 'artistic-introduction' }" />
    <EssayView :spec="spec" :id="activeId" class="mwnf-panel" />
  </div>
</template>

<style scoped>
.theme-wrap { display: flex; flex-direction: column; gap: 10px; }
</style>
