<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { StandaloneSponsorList } from '@museumwnf/viewer-layout/standalone'
import { PROJECTS } from '../dataset.config.js'
import rows from '../legacy/sponsors.json'

// atrium_sponsor_detail.php?id=ISL&flg=inter, the Sponsors page the partner
// pages link to: legacy's international sponsors, each with its name, web
// address and logo. Sponsors are website copy, not inventory data (Pascal,
// 2026-10-20): the rows come from legacy's sponsor tables through
// inventory-app's scripts/site-i18n (src/legacy/sponsors.json), the logos
// are legacy's files (theme/assets/legacy/sponsors, SOURCES.json).

// theme/assets/legacy/sponsors, fingerprinted by Vite, keyed as the rows name them.
const logos = Object.fromEntries(
  Object.entries(import.meta.glob('../../theme/assets/legacy/sponsors/*', { eager: true, query: '?url', import: 'default' })).map(
    ([path, url]) => [path.replace('../../theme/assets/legacy/', ''), url],
  ),
)
const sponsors = rows.map((row) => ({ ...row, logo: logos[row.logo] ?? '' }))

const { t, locale } = useI18n()
const list = (type) => ({ name: 'partners-results', query: { type, project: PROJECTS.discover, lang: locale.value } })
const back = computed(() => [
  { label: t('islamicart.pcr.back'), history: true },
  { label: t('islamicart.pmi.partnerMuseums'), to: list('museum') },
  { label: t('islamicart.pmi.otherPartners'), to: list('institution') },
])
</script>

<template>
  <StandaloneSponsorList :heading="t('islamicart.sponsors.internationalHeading')" :rows="sponsors" :back="back" />
</template>
