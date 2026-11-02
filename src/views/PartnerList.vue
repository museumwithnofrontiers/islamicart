<script setup>
import { computed } from 'vue'
import { I18nTextInline, useI18n } from '@museumwnf/viewer-core'
import { StandalonePartnerList } from '@museumwnf/viewer-layout/standalone'
import { PROJECTS } from '../dataset.config.js'
import { useData } from '../composables/data.js'
import { partnerListGroups } from '../composables/partner.js'

// Discover Islamic Art's partner museums or institutions as legacy's
// pm_partner_list.php, the standalone family's list (viewer-layout's
// `StandalonePartnerList`): the way back, with Explore's link on the right
// for the museums, then one row a country. Every word is legacy's own
// (islamicart.pl.*, islamicart.pmi.*, its translation table).

const props = defineProps({ type: { type: String, required: true } })

const { t, locale } = useI18n()
const { partnerLabel } = useData()

const museums = computed(() => props.type === 'museum')

const partnerLink = (partner) => ({
  id: partner.id,
  label: partnerLabel(partner.id),
  to: { name: 'partner', params: { id: partner.id }, query: { lang: locale.value } },
})
const groups = computed(() =>
  partnerListGroups(props.type).map((group) => ({
    label: group.label,
    main: group.main.map(partnerLink),
    associated: group.associated.map(partnerLink),
  })),
)

const list = (type, project) => ({ name: 'partners-results', query: { type, project, lang: locale.value } })
const back = computed(() => [
  { label: t('islamicart.pcr.back'), history: true },
  museums.value
    ? { label: t('islamicart.pmi.otherPartners'), to: list('institution', PROJECTS.discover) }
    : { label: t('islamicart.pmi.partnerMuseums'), to: list('museum', PROJECTS.discover) },
])
const heads = computed(() =>
  museums.value ? [t('islamicart.pl.partnerMuseums'), t('islamicart.pl.associatedMuseums')] : [t('islamicart.pmi.otherPartners')],
)
</script>

<template>
  <StandalonePartnerList
    :type="type"
    :groups="groups"
    :back="back"
    :heads="heads"
    :see-associated="t('islamicart.pl.seeAssociated')"
    :no-associated="t('islamicart.pl.noAssociated')"
  >
    <template #back>
      <RouterLink v-if="museums" class="islamicart-pl__eiac" :to="list('museum', PROJECTS.explore)" :title="t('islamicart.pl.eiacTooltip')"><I18nTextInline keypath="islamicart.pl.eiac" /></RouterLink>
    </template>
  </StandalonePartnerList>
</template>
