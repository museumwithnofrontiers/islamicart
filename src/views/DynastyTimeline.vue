<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isRtl, md, mdInline, removeEndingPoint, useI18n } from '@museumwnf/viewer-core'
import { useData } from '../composables/data.js'
import { useDynasties } from '../composables/dynasties.js'
import DynastiesBack from '../dynasties/DynastiesBack.vue'
import DynastiesFrame from '../dynasties/DynastiesFrame.vue'
import DynastiesPages from '../dynasties/DynastiesPages.vue'
import { DOWNLOAD, UP_RIGHT_FROM_SQUARE } from '../dynasties/icons.js'

// A dynasty's timeline, as legacy's client drew it (/dynasties/timeline/:id):
// "Timeline for Abbasids" on a yellow band, every event that began in the
// dynasty's years, whatever the country, twelve to a page, in order of
// their first year; each its year on the left, its country and description
// on the right; and, beside the first ones, the box with all the events.
//
// Legacy's "All Events" opened every event of the period in a page of their
// own (its API's printable list); here it opens the site's timeline for the
// period. "Timeline for" and "A.D." were written into the client in English,
// whatever the language: they are English-only entries.
const props = defineProps({ id: { type: String, required: true } })
const PAGE_SIZE = 12

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { timelineEvents, countryLabel, tr } = useData()
const { dynasties, textOf } = useDynasties()

const dynasty = computed(() => (dynasties.value ?? []).find((d) => d.id === props.id) ?? null)
const name = computed(() => mdInline(removeEndingPoint(textOf(props.id).name ?? '')))
const dir = computed(() => (isRtl(locale.value) ? 'rtl' : 'ltr'))

const events = computed(() => {
  const d = dynasty.value
  if (!d) return []
  return (timelineEvents.value ?? [])
    .filter((event) => event.year_from >= d.from_ad && event.year_from <= d.to_ad)
    .sort((a, b) => (a.year_from - b.year_from) || (a.display_order - b.display_order))
})
const last = computed(() => Math.max(1, Math.ceil(events.value.length / PAGE_SIZE)))
const page = computed(() => Math.min(last.value, Math.max(1, Number(route.query.page) || 1)))
const rows = computed(() => events.value
  .slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
  .map((event) => ({
    id: event.id,
    year: t('islamicart.dynasties.ad').replace('[DATE]', String(event.year_from)),
    country: event.country_id ? countryLabel(event.country_id) : '',
    html: md(tr('timeline_events', event.id).description ?? ''),
  })))

const allEvents = computed(() => {
  const d = dynasty.value
  return d ? { name: 'timeline-results', query: { country: 'all', begin: String(d.from_ad), end: String(d.to_ad) } } : null
})
const allEventsHref = computed(() => (allEvents.value ? router.resolve(allEvents.value).href : ''))

const go = (to) => router.push({ query: { ...route.query, page: to === 1 ? undefined : String(to) } })
</script>

<template>
  <DynastiesFrame>
    <div class="dyn-timeline">
      <div>
        <div class="dyn-timeline__band">
          <p class="dyn-timeline__information">{{ $t('islamicart.dynasties.timelineFor') }} <span class="dyn-timeline__bold" v-html="name"></span></p>
          <div
            v-if="rows.length"
            class="dyn-timeline__related"
            :class="last > 1 ? 'dyn-timeline__related--paged' : 'dyn-timeline__related--single'"
            :dir="dir"
          >
            <div>
              <p class="dyn-timeline__related-header">
                <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="DOWNLOAD" /></svg>{{ $t('islamicart.dynasties.download') }}
              </p>
              <p>
                <a :href="allEventsHref" target="_blank">
                  <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="UP_RIGHT_FROM_SQUARE" /></svg>{{ $t('islamicart.dynasties.allEvents') }}
                </a>
              </p>
            </div>
          </div>
        </div>
        <DynastiesBack class="dyn-timeline__back" />
        <div v-if="last > 1" class="dyn-timeline__pages">
          <DynastiesPages class="dyn-timeline__pages--top" :current="page" :last="last" @go="go" />
        </div>
        <div class="dyn-timeline__container">
          <div v-if="rows.length" class="dyn-timeline__labels" :dir="dir">
            <div class="dyn-timeline__date-label">{{ $t('islamicart.dynasties.date') }}</div>
            <div class="dyn-timeline__country-label">{{ $t('islamicart.dynasties.country') }} | {{ $t('islamicart.dynasties.description') }}</div>
          </div>
          <div v-if="rows.length" class="dyn-timeline__events">
            <div v-for="row in rows" :key="row.id" class="dyn-timeline__row" :dir="dir">
              <div class="dyn-timeline__event-container">
                <div class="dyn-timeline__year"><span>{{ row.year }}</span></div>
                <div class="dyn-timeline__event">
                  <div class="dyn-timeline__country">{{ row.country }}</div>
                  <div class="dyn-timeline__description" v-html="row.html"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="last > 1" class="dyn-timeline__pages">
          <DynastiesPages class="dyn-timeline__pages--bottom" :current="page" :last="last" @go="go" />
        </div>
        <div v-else class="dyn-timeline__padding"></div>
      </div>
    </div>
  </DynastiesFrame>
</template>

<style scoped>
.dyn-timeline {
  width: 100%;
  background-color: #fff;
}

.dyn-timeline__bold {
  font-weight: 700;
}

.dyn-timeline__band {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 50px;
  color: #222;
  background-color: #eec201;
}

.dyn-timeline__information {
  font-size: 110%;
  text-transform: uppercase;
}

/* The box, beside the first events: under the band, the page navigation and
   the column labels when there is a navigation, else under the band and the
   labels. */
.dyn-timeline__related {
  position: absolute;
  right: 0;
  width: 25%;
  padding: 20px 20px 40px;
  color: #222;
  background-color: #e0b700;
}

.dyn-timeline__related--paged { top: calc(100% + 149px); }
.dyn-timeline__related--single { top: calc(100% + 91px); }

.dyn-timeline__related a {
  color: #222;
  text-decoration: none;
}

.dyn-timeline__related-header {
  margin: 30px 0 10px;
  font-size: 110%;
  font-weight: 700;
  text-decoration: underline;
}

.dyn-timeline .dyn-timeline__back {
  height: 50px;
  padding: 0 50px;
}

.dyn-timeline__pages {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dyn-timeline__pages > * {
  margin-bottom: 30px;
  background-color: #fff;
}

.dyn-timeline__container {
  width: 100%;
  min-height: 200px;
  padding: 0 50px 30px;
  background-color: #fff;
}

.dyn-timeline__labels {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 75%;
  margin-bottom: 20px;
  font-size: 110%;
}

.dyn-timeline__date-label {
  width: 30%;
  margin-right: 2%;
}

.dyn-timeline__country-label {
  width: 70%;
}

.dyn-timeline__row {
  width: 75%;
}

.dyn-timeline__event-container {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
}

.dyn-timeline__year {
  width: 30%;
  margin-right: 2%;
  border-top: 2px solid #e0b700;
}

.dyn-timeline__year span {
  padding: 2px 10px;
  color: #222;
  background-color: #e0b700;
}

.dyn-timeline__event {
  width: 70%;
}

.dyn-timeline__country {
  padding: 2px 10px;
  letter-spacing: 0.5px;
  color: #222;
  background-color: #e0b700;
}

.dyn-timeline__description {
  padding: 15px 0 25px;
}

.dyn-timeline__description :deep(p) {
  margin: 0;
}

.dyn-timeline__padding {
  display: inline-block;
  margin-bottom: 65px;
}

@media (max-width: 1199px) {
  .dyn-timeline__band { padding: 12px 50px; }
  .dyn-timeline__labels { font-size: 105%; }
}

@media (max-width: 974px) {
  .dyn-timeline__information,
  .dyn-timeline__related-header { font-size: 105%; }

  .dyn-timeline__date-label { width: 20%; }
  .dyn-timeline__country-label { width: 80%; }

  .dyn-timeline__year {
    width: 20%;
    border-top: 2px solid #fff;
  }

  .dyn-timeline__event { width: 80%; }
}

/* From 849px down the box goes under the events, over the last navigation. */
@media (max-width: 849px) {
  .dyn-timeline > div { position: relative; }
  .dyn-timeline__band { position: static; }

  .dyn-timeline__related {
    width: calc(100% - 100px);
    margin: 0 50px;
    padding: 20px 20px 30px;
  }

  .dyn-timeline__related--paged {
    top: auto;
    bottom: 30px;
  }

  .dyn-timeline__related-header { margin-top: 10px; }

  .dyn-timeline__labels,
  .dyn-timeline__row { width: 100%; }

  .dyn-timeline__year { border-top: 2px solid #ffd500; }
  .dyn-timeline__pages > .dyn-timeline__pages--bottom { margin-bottom: 175px; }
}

@media (max-width: 724px) {
  .dyn-timeline__year { border-top: 2px solid #fff; }
}

@media (max-width: 599px) {
  .dyn-timeline__band { padding: 20px 30px; }

  .dyn-timeline__information {
    display: flex;
    flex-direction: column;
  }

  .dyn-timeline .dyn-timeline__back { padding: 0 30px; }

  .dyn-timeline__related {
    width: calc(100% - 60px);
    margin: 0 30px;
    padding: 10px 20px 20px;
  }

  .dyn-timeline__container { padding: 0 30px 30px; }
  .dyn-timeline__date-label { width: 22%; }
  .dyn-timeline__country-label { width: 78%; }
  .dyn-timeline__year { width: 22%; }
  .dyn-timeline__event { width: 78%; }
}

@media (max-width: 499px) {
  .dyn-timeline__band { padding-bottom: 15px; }

  .dyn-timeline__date-label,
  .dyn-timeline__year { margin-right: 0; }

  .dyn-timeline__country,
  .dyn-timeline__year span { padding: 2px 5px; }
}

@media (max-width: 399px) {
  .dyn-timeline__year {
    width: 20%;
    padding: 2px 5px;
    border-top: none;
    background-color: #e0b700;
  }

  .dyn-timeline__year span { padding: 0; }

  .dyn-timeline__event {
    width: 80%;
    margin-left: 5px;
  }

  .dyn-timeline__country-label { margin-left: 5px; }
}
</style>
