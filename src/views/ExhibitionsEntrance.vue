<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { SectionCards } from '@museumwnf/viewer-layout/content'
import { exhibitionsTree, minisiteHref } from '../composables/exhibitions.js'
import { useData } from '../composables/data.js'

// The exhibitions list: one card per exhibition, `SectionCards`' `rows`
// variant, leading to the exhibition's own website (its mini-site). A card's
// title is catalogue data, not a fixed entry, so it is stripped of Markdown
// rather than rendered — `SectionCards` interpolates it as plain text, not
// HTML.
const { mdStrip, tr } = useData()
const { t, locale } = useI18n()

const exhibitionCards = computed(() => {
  const root = exhibitionsTree.root.value
  if (!root) return []
  return exhibitionsTree.children(root.id).map((exhibition) => ({
    title: mdStrip(tr('collections', exhibition.id).title ?? exhibition.internal_name),
    href: minisiteHref(exhibition.id, locale.value) ?? undefined,
  }))
})
</script>

<template>
  <div v-if="!exhibitionCards.length" class="mwnf-panel">
    <p>{{ t('standalone.notFound.exhibitions') }}</p>
  </div>

  <div v-else>
    <h1 class="mwnf-heading">{{ t('standalone.nav.exhibitions') }}</h1>
    <div class="mwnf-panel">
      <p>{{ t('standalone.exhibition.selectPrompt') }}</p>
      <SectionCards :cards="exhibitionCards" variant="rows" />
    </div>
  </div>
</template>
