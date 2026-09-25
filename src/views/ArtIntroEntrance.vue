<script setup>
import { computed } from 'vue'
import { TextPageView } from '@museumwnf/viewer-layout/views'
import { SectionCards } from '@museumwnf/viewer-layout/content'
import { artIntroRoot, artIntroTree } from '../composables/artIntro.js'
import { useData } from '../composables/data.js'

// The Artistic Introduction entrance: the section root's own subtitle/
// description/credits (per-record catalogue text on the marker's single
// child — composables/artIntro.js), plus a card per theme. The
// description goes through `TextPageView`'s `body(ctx)` (the dotted-path/
// context-function form, metanull/viewer-layout#49); the subtitle and
// credits have no home in `TextPageView`'s own contract (heading is an
// entry name only, and it carries no slots), so this view renders them
// itself, around it, same as the site's other entrance pages render their
// own `.mwnf-heading`.
const { mdInline, mdStrip, tr } = useData()

const rootText = computed(() => {
  const root = artIntroRoot.value
  return root ? (tr('collections', root.id) ?? {}) : {}
})

const spec = computed(() => ({
  heading: false,
  body: (ctx) => (artIntroRoot.value ? (ctx.tr('collections', artIntroRoot.value.id)?.description ?? '') : ''),
  back: false,
}))

const themeCards = computed(() => {
  const root = artIntroRoot.value
  if (!root) return []
  return artIntroTree.children(root.id).map((theme) => ({
    title: mdStrip(tr('collections', theme.id)?.title ?? theme.internal_name),
    to: { name: 'artistic-introduction-theme', params: { themeId: theme.id } },
  }))
})
</script>

<template>
  <div v-if="!artIntroRoot" class="mwnf-panel not-found">
    <p>{{ $t('islamicart.notFound.artIntro') }}</p>
  </div>

  <div v-else>
    <h1 class="mwnf-heading">{{ $t('islamicart.nav.artisticIntroduction') }}</h1>

    <div class="mwnf-panel intro-box">
      <h2 v-if="rootText.extra?.subtitle" class="intro-subtitle" v-html="mdInline(rootText.extra.subtitle)" />
      <TextPageView :spec="spec" />
      <p v-if="rootText.extra?.credits" class="intro-credits" v-html="mdInline(rootText.extra.credits)" />
    </div>

    <div class="mwnf-panel">
      <p class="intro-text">{{ $t('islamicart.artIntro.selectTheme') }}</p>
      <SectionCards :cards="themeCards" variant="rows" />
    </div>
  </div>
</template>

<style scoped>
.not-found { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

.intro-box { border-top: 3px solid var(--accent-dark); }
.intro-subtitle {
  font-size: 16px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 12px;
  font-family: 'Roboto', sans-serif;
}
.intro-box :deep(.mwnf-prose) { font-size: 14px; line-height: 1.7; color: var(--text); font-family: 'Roboto', sans-serif; }
.intro-box :deep(.mwnf-prose p) { margin: 0 0 .75em; }
.intro-box :deep(.mwnf-prose p:last-child) { margin-bottom: 0; }

.intro-credits {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  font-style: italic;
  color: var(--muted);
  font-family: 'Roboto', sans-serif;
}

.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}
</style>
