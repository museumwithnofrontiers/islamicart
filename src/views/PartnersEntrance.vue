<script setup>
import { computed } from 'vue'
import { mwnfLinks, useI18n } from '@museumwnf/viewer-core'
import { StandalonePartnersEntrance } from '@museumwnf/viewer-layout/standalone'
import { PROJECTS } from '../dataset.config.js'

// Discover Islamic Art's Partners entrance, legacy's partners.php (the menu's
// Partners): the project's box, its About text and links, then Explore
// Islamic Art Collections' row. Every word is legacy's own (islamicart.partner.*,
// its translation table and the project's name).

const { t, locale } = useI18n()
const list = (type) => ({ name: 'partners-results', query: { type, project: PROJECTS.discover, lang: locale.value } })
const projects = computed(() => [
  {
    name: t('islamicart.partner.projectName'),
    about: t('islamicart.partner.about'),
    links: [
      { label: t('islamicart.partner.museums'), to: list('museum') },
      { label: t('islamicart.partner.others'), to: list('institution') },
      { label: t('islamicart.partner.sponsors'), to: { name: 'sponsors', query: { lang: locale.value } } },
      { label: t('islamicart.footer.credits'), href: mwnfLinks.credits },
    ],
  },
  {
    name: t('islamicart.partner.explore'),
    about: t('islamicart.partner.exploreAbout'),
    links: [{ label: t('islamicart.partner.explorePartners'), to: { name: 'partners-explore', query: { type: 'museum', lang: locale.value } } }],
  },
])
</script>

<template>
  <StandalonePartnersEntrance :projects="projects" :about-label="t('islamicart.partner.aboutLink')" :close-label="t('core.action.close')" />
</template>
