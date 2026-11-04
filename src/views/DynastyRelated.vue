<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isRtl, mdInline, removeEndingPoint, useI18n } from '@museumwnf/viewer-core'
import { legacyOrder } from '../composables/catalogue.js'
import { useData } from '../composables/data.js'
import { useDynasties } from '../composables/dynasties.js'
import DynastiesBack from '../dynasties/DynastiesBack.vue'
import DynastiesFrame from '../dynasties/DynastiesFrame.vue'
import DynastiesPages from '../dynasties/DynastiesPages.vue'

// A dynasty's objects or monuments, as legacy's client listed them
// ("125 Related Objects for Abbasids"): twelve to a page, two to a row, each
// a picture beside its name, place and date; on the left, the one the
// pointer is over (the page's first until then), its picture large; the
// page navigation over and under them.
const props = defineProps({
  id: { type: String, required: true },
  kind: { type: String, required: true },
})
const PAGE_SIZE = 12

const route = useRoute()
const router = useRouter()
const { countryLabel, itemRoute, languageOf, tr } = useData()
const { textOf, recordsOf } = useDynasties()

const type = computed(() => (props.kind === 'monuments' ? 'monument' : 'object'))
const name = computed(() => mdInline(removeEndingPoint(textOf(props.id).name ?? '')))
const records = computed(() => legacyOrder(recordsOf(props.id, type.value)))
const last = computed(() => Math.max(1, Math.ceil(records.value.length / PAGE_SIZE)))
const page = computed(() => Math.min(last.value, Math.max(1, Number(route.query.page) || 1)))

// The client's date: cut at the last space before the 150th character, with
// "...", when longer.
const shortDate = (date) => {
  if (!date || date.length <= 150) return date ?? ''
  return `${date.slice(0, date.lastIndexOf(' ', 150))}...`
}

const rows = computed(() => records.value
  .slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
  .map((item) => {
    const lang = languageOf('items', item.id)
    const text = tr('items', item.id, lang)
    return {
      id: item.id,
      to: itemRoute(item),
      image: item.images?.[0]?.url ?? '',
      name: mdInline(removeEndingPoint(text.name ?? '')),
      place: [text.location, countryLabel(item.country_id, lang)].filter(Boolean).join(', '),
      date: shortDate(text.dates),
    }
  }))

// The large one: the one the pointer was last over, else the page's first.
const pointed = ref(null)
watch(rows, () => { pointed.value = null })
const main = computed(() => pointed.value ?? rows.value[0] ?? null)

// In Arabic the heading and each record's lines run right to left, as
// legacy's did, the lines against the right edge.
const { locale } = useI18n()
const dir = computed(() => (isRtl(locale.value) ? 'rtl' : 'ltr'))

const go = (to) => router.push({ query: { ...route.query, page: to === 1 ? undefined : String(to) } })
</script>

<template>
  <DynastiesFrame>
    <div class="dyn-results">
      <div>
        <DynastiesBack class="dyn-results__back" />
        <DynastiesPages v-if="last > 1" class="dyn-results__pages dyn-results__pages--top" :current="page" :last="last" @go="go" />
        <div class="dyn-results__header" :dir="dir">
          {{ records.length }} {{ type === 'monument' ? $t('islamicart.dynasties.relatedMonumentsFor') : $t('islamicart.dynasties.relatedObjectsFor') }}
          <span class="dyn-results__bold" v-html="name"></span>
        </div>
        <div class="dyn-results__wrapper">
          <div v-if="main" class="dyn-results__main">
            <div class="dyn-results__main-photo"><img v-if="main.image" :src="main.image" alt="" /></div>
            <div :dir="dir">
              <div class="dyn-results__main-name">
                <p class="dyn-results__bold" v-html="main.name"></p>
                <p>{{ main.date }}</p>
              </div>
              <div><p>{{ main.place }}</p></div>
            </div>
          </div>
          <div class="dyn-results__list">
            <div v-for="row in rows" :key="row.id" class="dyn-results__item">
              <div class="dyn-result">
                <RouterLink :to="row.to">
                  <img v-if="row.image" class="dyn-result__image" :src="row.image" alt="" @mouseover="pointed = row" />
                </RouterLink>
                <div class="dyn-result__details" :class="{ 'dyn-result__details--rtl': dir === 'rtl' }" :dir="dir">
                  <RouterLink :to="row.to" @mouseover="pointed = row">
                    <span class="dyn-results__bold" v-html="row.name"></span><span v-if="row.place">, {{ row.place }}</span>
                  </RouterLink>
                  <p class="dyn-result__date">{{ row.date }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DynastiesPages v-if="last > 1" class="dyn-results__pages dyn-results__pages--bottom" :current="page" :last="last" @go="go" />
        <div class="dyn-results__padding"></div>
      </div>
    </div>
  </DynastiesFrame>
</template>

<style scoped>
.dyn-results {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 60px;
  background-color: #fff;
}

.dyn-results__bold {
  font-weight: 700;
}

.dyn-results__pages--top {
  margin-top: 30px;
}

.dyn-results__pages--bottom {
  margin-bottom: 30px;
}

.dyn-results__header {
  margin-top: 30px;
  font-size: 125%;
}

.dyn-results__wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}

.dyn-results__main {
  width: 25%;
  padding: 30px 0;
}

.dyn-results__main-photo {
  margin-bottom: 15px;
}

.dyn-results__main-photo img {
  display: block;
  width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.dyn-results__main-name {
  margin-bottom: 15px;
}

.dyn-results__list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px 30px;
  width: 75%;
  padding: 30px 0 30px 40px;
}

.dyn-result {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 120px;
  font-size: 14px;
  color: #222;
}

.dyn-result a {
  color: #222;
  text-decoration: none;
}

.dyn-result__image {
  display: block;
  width: 150px;
  height: 120px;
  object-fit: contain;
  border: 1px solid rgba(255, 213, 0, 0.5);
}

.dyn-result__details {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  padding-left: 10px;
}

.dyn-result__details--rtl {
  width: 100%;
  align-items: flex-end;
}

.dyn-result__details a {
  width: 100%;
  margin-bottom: 5px;
}

.dyn-result__details a:hover {
  text-decoration: underline;
}

.dyn-result__details p {
  width: 100%;
}

.dyn-result__date {
  font-style: italic;
}

.dyn-results__padding {
  margin-bottom: 75px;
}

@media (max-width: 1199px) {
  .dyn-result { height: 175px; }

  .dyn-result__image {
    width: 120px;
    height: 175px;
  }
}

/* Below 975px the client drew no large picture. */
@media (max-width: 974px) {
  .dyn-results__main { display: none; }

  .dyn-results__list {
    width: 100%;
    padding-left: 0;
  }

  .dyn-result { height: 135px; }

  .dyn-result__image {
    width: 150px;
    height: 135px;
  }
}

@media (max-width: 849px) {
  .dyn-result,
  .dyn-result__image { height: 175px; }
}

@media (max-width: 724px) {
  .dyn-results__list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-bottom: 20px;
  }

  .dyn-results__item { width: 100%; }

  .dyn-result {
    width: 100%;
    height: 200px;
    margin-bottom: 20px;
  }

  .dyn-result > a { width: 38%; }

  .dyn-result__image {
    width: 100%;
    height: 200px;
  }

  .dyn-result__details { width: 62%; }
}

@media (max-width: 599px) {
  .dyn-results .dyn-results__back { padding: 30px 30px 0; }
  .dyn-results__wrapper { padding: 0 30px; }
  .dyn-result__details a { width: 100%; }
}

@media (max-width: 499px) {
  .dyn-results__list { width: 100%; }

  .dyn-result {
    flex-direction: column;
    height: 250px;
  }

  .dyn-result > a {
    width: 100%;
    height: 65%;
  }

  .dyn-result__image { height: 100%; }

  .dyn-result__details {
    width: 100%;
    height: 35%;
    margin-top: 10px;
    padding-left: 0;
  }

  .dyn-result__details a { height: auto; }
}

@media (max-width: 399px) {
  .dyn-result { height: 225px; }
}
</style>
