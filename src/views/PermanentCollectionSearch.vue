<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFacets, useI18n, I18nText } from '@museumwnf/viewer-core'
import { useData } from '../composables/data.js'
import { FACETS, centuries } from '../composables/catalogue.js'

// The Permanent Collection entrance as legacy's pc_entrance.php: "Sort by"
// and its lists on the left, each opening the results as soon as a value is
// picked (legacy's onchange submits), and "About" with legacy's text on the
// right. Every word is legacy's own (islamicart.pc.*, its translation
// table); the lists' values are the records' own.

const { items } = useData()
const { t, locale } = useI18n()
const router = useRouter()
const options = useFacets(items, FACETS)

// Both lists by name, as legacy's were (its dynasty list too: Abbasids,
// Afsharid, Aghlabids…).
const byLabel = (list) => [...(list ?? [])].sort((a, b) => a.label.localeCompare(b.label, locale.value))
const countries = computed(() => byLabel(options.value.country))
const dynasties = computed(() => byLabel(options.value.dynasty))

// Legacy's "[DATE] A.D.": the year, then the era's own word.
const ad = (year) => `${year} ${t('islamicart.pc.ad')}`

function open(key, value) {
  if (value) router.push({ name: 'permanent-collection-results', query: { [key]: String(value), lang: locale.value } })
}

// Legacy's Partners list led to its partner list.
function openPartners(value) {
  if (value === 'ISL') router.push({ name: 'partners', query: { lang: locale.value } })
}
</script>

<template>
  <div class="islamicart-pc">
    <div class="islamicart-pc__lists">
      <h3 class="islamicart-pc__heading">{{ t('islamicart.pc.sortBy') }}</h3>
      <p>
        <select @change="open('country', $event.target.value)">
          <option value="">{{ t('islamicart.pc.country') }}</option>
          <option value="" disabled></option>
          <option v-for="o in countries" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </p>
      <p>
        <select @change="open('dynasty', $event.target.value)">
          <option value="">{{ t('islamicart.sheet.periodDynasty') }}</option>
          <option v-for="o in dynasties" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </p>
      <p>
        <select @change="openPartners($event.target.value)">
          <option value="">{{ t('islamicart.pc.partners') }}</option>
          <option value="ISL">{{ t('islamicart.pc.partnersIsl') }}</option>
        </select>
      </p>
      <p>
        <select @change="open('begin', $event.target.value)">
          <option value="">{{ t('islamicart.pc.startDate') }}</option>
          <option v-for="c in centuries" :key="c" :value="c">{{ ad(c) }}</option>
        </select>
      </p>
      <p>
        <select @change="open('end', $event.target.value)">
          <option value="">{{ t('islamicart.pc.endDate') }}</option>
          <option v-for="c in centuries" :key="c" :value="c + 100">{{ ad(c + 100) }}</option>
        </select>
      </p>
    </div>
    <div class="islamicart-pc__about">
      <h3 class="islamicart-pc__heading">{{ t('islamicart.pc.about') }}</h3>
      <I18nText tag="div" class="islamicart-pc__text" keypath="islamicart.pc.text" />
    </div>
  </div>
</template>
