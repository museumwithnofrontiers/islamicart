<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { artIntroHref, artIntroPosition, artIntroRoot } from '../composables/artIntro.js'

// The Artistic Introduction's pages left this site: it is a website of its
// own (its mini-site, src/minisites.json). The addresses this site gave them
// lead there — the entrance to the mini-site's home, a theme (and its page,
// `?tab`) to the same page there.
const props = defineProps({ themeId: { type: String, default: null } })
const { t, locale } = useI18n()
const route = useRoute()

const target = computed(() => {
  if (!props.themeId) return artIntroHref(locale.value)
  const theme = artIntroRoot.value ? artIntroPosition(artIntroRoot.value.id, props.themeId) : 0
  return theme > 0 ? artIntroHref(locale.value, { theme, page: Number(route.query.tab ?? 0) + 1 }) : null
})

watchEffect(() => {
  if (target.value) window.location.replace(target.value)
})
</script>

<template>
  <div class="mwnf-panel">
    <p v-if="target"><a :href="target">{{ t('islamicart.nav.artisticIntroduction') }}</a></p>
    <p v-else>{{ t('islamicart.notFound.artIntro') }}</p>
  </div>
</template>
