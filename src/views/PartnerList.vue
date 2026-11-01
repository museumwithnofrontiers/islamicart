<script setup>
import { computed, ref, watch } from 'vue'
import { I18nTextInline, useI18n } from '@museumwnf/viewer-core'
import { PROJECTS } from '../dataset.config.js'
import { useData } from '../composables/data.js'
import { partnerListGroups } from '../composables/partner.js'

// Discover Islamic Art's partner museums or institutions as legacy's
// pm_partner_list.php: the way back, then one row a country. Museums: the
// country beside "See Associated Museums", which opens that country's
// associated museums and closes any other. Institutions: the country itself
// opens and closes, every country open at first. Every word is legacy's own
// (islamicart.pl.*, islamicart.pmi.*, its translation table).

const props = defineProps({ type: { type: String, required: true } })

const { t, locale } = useI18n()
const { partnerLabel } = useData()

const museums = computed(() => props.type === 'museum')
const groups = computed(() => partnerListGroups(props.type))

// legacy's js/accordion.js: one section open at a time, its title active;
// a click on the active title closes them all.
const active = ref(null)
const opened = ref(new Set())
watch(
  [museums, () => groups.value.length],
  () => {
    active.value = museums.value ? null : 0
    opened.value = museums.value ? new Set() : new Set(groups.value.map((_, i) => i))
  },
  { immediate: true },
)
function toggle(index) {
  const closing = active.value === index
  active.value = closing ? null : index
  opened.value = closing ? new Set() : new Set([index])
}

const partnerLink = (partner) => ({ name: 'partner', params: { id: partner.id }, query: { lang: locale.value } })
const list = (type, project) => ({ name: 'partners-results', query: { type, project, lang: locale.value } })
</script>

<template>
  <div class="islamicart-pl" :class="museums ? 'islamicart-pl--museums' : 'islamicart-pl--institutions'">
    <p class="mwnf-standalone-item__back islamicart-pl__back">
      <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('islamicart.pcr.back') }}</button>
      <RouterLink v-if="museums" class="mwnf-standalone-item__back-link" :to="list('institution', PROJECTS.discover)">{{ t('islamicart.pmi.otherPartners') }}</RouterLink>
      <RouterLink v-else class="mwnf-standalone-item__back-link" :to="list('museum', PROJECTS.discover)">{{ t('islamicart.pmi.partnerMuseums') }}</RouterLink>
      <RouterLink v-if="museums" class="islamicart-pl__eiac" :to="list('museum', PROJECTS.explore)" :title="t('islamicart.pl.eiacTooltip')"><I18nTextInline keypath="islamicart.pl.eiac" /></RouterLink>
    </p>
    <div class="islamicart-pl__heads">
      <h3 v-if="museums">{{ t('islamicart.pl.partnerMuseums') }}</h3>
      <h3 v-else>{{ t('islamicart.pmi.otherPartners') }}</h3>
      <h3 v-if="museums">{{ t('islamicart.pl.associatedMuseums') }}</h3>
    </div>

    <div v-for="(group, index) in groups" :key="group.label" class="islamicart-pl__country">
      <div class="islamicart-pl__head">
        <h3 v-if="museums">{{ group.label }}</h3>
        <h3>
          <a href="#" class="islamicart-pl__toggle" :class="{ 'islamicart-pl__toggle--active': active === index }" @click.prevent="toggle(index)">
            {{ museums ? t('islamicart.pl.seeAssociated') : group.label }}
          </a>
        </h3>
      </div>
      <div v-show="museums || opened.has(index)" class="islamicart-pl__row">
        <div class="islamicart-pl__main">
          <p v-for="partner in group.main" :key="partner.id"><RouterLink :to="partnerLink(partner)">{{ partnerLabel(partner.id) }}</RouterLink></p>
        </div>
        <div v-show="!museums || opened.has(index)" class="islamicart-pl__associated">
          <p v-for="partner in group.associated" :key="partner.id"><RouterLink :to="partnerLink(partner)">{{ partnerLabel(partner.id) }}</RouterLink></p>
          <p v-if="museums && !group.associated.length" class="islamicart-pl__none">{{ t('islamicart.pl.noAssociated') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
