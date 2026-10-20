<script setup>
import { computed } from 'vue'
import { projectLabel, useDataPackage, useI18n } from '@museumwnf/viewer-core'
import { StandaloneTextPage } from '@museumwnf/viewer-layout/standalone'
import { PROJECTS } from '../dataset.config.js'

// isl_missionstatement.php: the mission statement with its drop cap, then the
// project's own name (legacy's `projectnames`, the manifest's here) linking
// to the Permanent Collection, then Print.
const { manifest } = useDataPackage()
const { locale } = useI18n()
const link = computed(() => ({
  text: projectLabel(manifest, PROJECTS.discover, locale.value) || projectLabel(manifest, PROJECTS.discover, 'en'),
  to: { name: 'permanent-collection' },
}))
</script>

<template>
  <!-- Legacy set no drop cap on the Arabic page. -->
  <StandaloneTextPage body="islamicart.missionStatement.body" :drop-cap="locale !== 'ar'" :link="link" print="islamicart.page.print" />
</template>
