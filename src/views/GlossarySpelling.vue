<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { StandaloneGlossarySpelling } from '@museumwnf/viewer-layout/standalone'

// Legacy's Glossary & Spelling window (glossarysearch.php), opened from the
// Database entrance: the standalone family's window with legacy's words, in
// the language the site is read in. Legacy's window stayed left to right in
// Arabic, as its item sheet's columns did.
const { t, locale } = useI18n()

const labels = computed(() => ({
  heading: t('islamicart.glossary.heading'),
  intro: t('islamicart.glossary.intro'),
  definition: t('islamicart.glossary.definition'),
  spellings: t('islamicart.glossary.spellings'),
  spellingsNote: t('islamicart.glossary.spellingsNote'),
  close: t('record.glossary.close'),
}))
</script>

<template>
  <StandaloneGlossarySpelling :language="locale" :labels="labels" dir="ltr" />
</template>
