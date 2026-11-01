<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { eiacListGroups } from '../composables/partner.js'

// Explore Islamic Art Collections' partners as legacy's
// pm_partner_list_eiac.php: the way back, legacy's line about the project,
// the heading beside the Language Policy link, then one section a country,
// the first open, a click opening another (js/accordion.js); in each, every
// partner with its picture, its city and its name, two a row. Legacy's page
// is in English only, its navigation included ("In this area navigation is
// in English only"), so its words exist in English alone (islamicart.eiac.*)
// and every language reads them; the names and countries are English too.

const route = useRoute()
const { t, locale } = useI18n()

const type = computed(() => (route.query.type === 'institution' ? 'institution' : 'museum'))
const groups = computed(() => eiacListGroups(type.value))

// Legacy's accordion never closes the open section: a click on its title
// opens it again.
const open = ref(0)
watch(type, () => {
  open.value = 0
})

const partnerLink = (partner) => ({ name: 'partner', params: { id: partner.id }, query: { lang: locale.value } })
const LANGUAGE_POLICY = 'https://www.museumwnf.org/about/language-policy'
</script>

<template>
  <div class="islamicart-eiac">
    <p class="mwnf-standalone-item__back islamicart-eiac__back">
      <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('islamicart.eiac.back') }}</button>
    </p>
    <p class="islamicart-eiac__subtitle"><span>{{ t('islamicart.eiac.subtitle') }}</span></p>
    <div class="islamicart-eiac__heads">
      <h3>{{ t('islamicart.eiac.institutions') }}</h3>
      <p><a :href="LANGUAGE_POLICY" :title="t('islamicart.eiac.languagePolicyTooltip')">{{ t('islamicart.eiac.languagePolicy') }}</a></p>
    </div>

    <div class="islamicart-eiac__list">
      <template v-for="(group, index) in groups" :key="group.label">
        <div class="islamicart-eiac__head" :class="{ 'islamicart-eiac__head--active': open === index }">
          <a href="#" class="islamicart-eiac__toggle" :aria-expanded="open === index ? 'true' : 'false'" @click.prevent="open = index">
            <h3>{{ group.label }}</h3>
            <span class="islamicart-eiac__cog" aria-hidden="true"></span>
          </a>
        </div>
        <div v-show="open === index" class="islamicart-eiac__content">
          <div
            v-for="entry in group.entries"
            :key="entry.partner.id"
            class="islamicart-eiac__cell"
            :class="{ 'islamicart-eiac__cell--associated': entry.associated }"
          >
            <RouterLink v-if="entry.image" class="islamicart-eiac__picture" :to="partnerLink(entry.partner)">
              <img :src="entry.image" alt="" loading="lazy" />
            </RouterLink>
            <div class="islamicart-eiac__text">
              <p v-if="entry.city">{{ entry.city }}</p>
              <p><strong><RouterLink :to="partnerLink(entry.partner)">{{ entry.name }}</RouterLink></strong></p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
