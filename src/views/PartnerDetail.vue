<script setup>
import { useI18n } from '@museumwnf/viewer-core'
import { StandalonePartnerPage } from '@museumwnf/viewer-layout/standalone'
import { PROJECTS } from '../dataset.config.js'
import { exploreOnly, partnerItemsLink, partnerProfileView, listsAbout } from '../composables/partner.js'

// The partner profile as legacy's pm_partner.php: the standalone family's
// page (viewer-layout's `StandalonePartnerPage`), with what is this
// website's: its ways back, its link to the partner's items, and every word
// legacy's own (islamicart.pp.*, islamicart.pmi.*, its translation table).

defineProps({ id: { type: String, required: true } })

const { locale } = useI18n()

const list = (type, project) => ({ name: 'partners-results', query: { type, project, lang: locale.value } })
// Legacy's links back, for the list the partner is reached from. Its
// Sponsors page and Explore's per-country list are not built yet: those
// two links wait for them.
const back = (record) => [
  { label: 'islamicart.pcr.back', history: true },
  ...(exploreOnly(record)
    ? [{ label: 'islamicart.pmi.allCountries', to: list('museum', PROJECTS.explore) }]
    : [
        { label: 'islamicart.pmi.partnerMuseums', to: list('museum', PROJECTS.discover) },
        { label: 'islamicart.pmi.otherPartners', to: list('institution', PROJECTS.discover) },
      ]),
]

const labels = {
  about: 'islamicart.pp.about',
  contact: 'islamicart.pp.contact',
  logo: 'islamicart.pp.logo',
  homepage: 'islamicart.pp.homepage',
  addresses: 'islamicart.pp.addresses',
  phone: 'islamicart.pp.phone',
  fax: 'islamicart.pp.fax',
  map: 'islamicart.pp.map',
}
</script>

<template>
  <StandalonePartnerPage
    :id="id"
    :view="partnerProfileView"
    :back="back"
    :items="partnerItemsLink"
    :about="listsAbout"
    :labels="labels"
  />
</template>
