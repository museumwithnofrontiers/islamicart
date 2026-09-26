<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BackLink, SourceCredit } from '@museumwnf/viewer-layout/content'
import { EssayView } from '@museumwnf/viewer-layout/views'
import { exhibitionTree } from '../composables/exhibitions.js'
import { exhibitionIntroductionSpec } from '../composables/exhibitionSpecs.js'
import { useData } from '../composables/data.js'

// The exhibition's introduction: not a theme, so it renders as an `about`
// essay over the exhibition node itself — its own `extra.intro_header` /
// `extra.intro_text`, reached through `spec.heading`/`spec.body`'s dotted
// path — plus the items attached to the exhibition collection directly,
// through the default grid (`spec.items.meta` for its caption lines).
const route = useRoute()
const { tr } = useData()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
// A new exhibition id is a new tree (`EssayView` reads `spec.tree` once, at
// setup); `:key` below forces the remount that keeps it in step.
const tree = exhibitionTree(exhibitionId.value)
const spec = exhibitionIntroductionSpec(tree)
const exhibitionTitle = computed(() => {
  const e = tree.root.value
  return e ? (tr('collections', e.id).title ?? e.internal_name) : ''
})
</script>

<template>
  <EssayView :key="exhibitionId" :spec="spec" :id="exhibitionId" class="mwnf-panel">
    <template #after>
      <!-- Filling EssayView's #after slot replaces its default SourceCredit,
           so the credit is drawn here, before the way back. -->
      <SourceCredit />
      <BackLink variant="bar" :to="{ name: 'exhibition', params: { exhibitionId } }">{{ $t('standalone.exhibition.backTo') }} {{ exhibitionTitle }}</BackLink>
    </template>
  </EssayView>
</template>
