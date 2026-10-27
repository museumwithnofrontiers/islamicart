<script setup>
import { computed, watchEffect } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { exhibitionsTree, minisiteHref } from '../composables/exhibitions.js'

// An exhibition's pages left this site: each exhibition is a website of its
// own (its mini-site, src/minisites.json). The addresses this site gave them
// lead there — an exhibition and its introduction to the mini-site's home,
// a theme to its first page.
const props = defineProps({
  exhibitionId: { type: String, required: true },
  themeId: { type: String, default: null },
})
const { t, locale } = useI18n()

const target = computed(() => {
  if (!props.themeId) return minisiteHref(props.exhibitionId, locale.value)
  const theme = exhibitionsTree.children(props.exhibitionId).findIndex((node) => node.id === props.themeId) + 1
  return theme > 0 ? minisiteHref(props.exhibitionId, locale.value, { theme, page: 1 }) : null
})

watchEffect(() => {
  if (target.value) window.location.replace(target.value)
})
</script>

<template>
  <div class="mwnf-panel">
    <p v-if="target"><a :href="target">{{ t('standalone.nav.exhibitions') }}</a></p>
    <p v-else>{{ t('standalone.notFound.exhibitions') }}</p>
  </div>
</template>
