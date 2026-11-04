<script setup>
import { computed, ref, watch } from 'vue'
import { byId, glossaryEntries, glossaryTermsFor, isRtl, md, mdInline, removeEndingPoint, useDataPackage, useGlossaryPopup, useI18n, useSiteConfig } from '@museumwnf/viewer-core'
import { chromeSource } from '@museumwnf/viewer-layout'
import { artIntroHref, artIntroPosition, artIntroRoot } from '../composables/artIntro.js'
import { useData } from '../composables/data.js'
import { useDynasties } from '../composables/dynasties.js'
import { minisiteHref } from '../composables/exhibitions.js'
import DynastiesBack from '../dynasties/DynastiesBack.vue'
import DynastiesFrame from '../dynasties/DynastiesFrame.vue'
import { REPLY, SHARE, UP_RIGHT_FROM_SQUARE, XMARK } from '../dynasties/icons.js'
import dynastyLinks from '../dynasties/links.json'

// A dynasty's profile, as legacy's client draws it: the languages its text
// is in, over the page; the way back, the name, "Also known as", the date
// line, the area in italics and the history; and, at the top right, the
// Related Content box: its objects and monuments, the timeline of its period,
// its Artistic Introduction theme and its exhibitions.
const props = defineProps({ id: { type: String, required: true } })
const { locale } = useI18n()
const pkg = useDataPackage()
const config = useSiteConfig()
const { tr } = useData()
const { dynasties, textOf, dateLine, recordsOf } = useDynasties()

const dynasty = computed(() => (dynasties.value ?? []).find((d) => d.id === props.id) ?? null)
const text = computed(() => (dynasty.value ? textOf(dynasty.value.id) : {}))
const objects = computed(() => recordsOf(props.id, 'object').length)
const monuments = computed(() => recordsOf(props.id, 'monument').length)
// The client's own timeline of the dynasty's years (DynastyTimeline.vue).
const timeline = computed(() => (dynasty.value?.from_ad != null ? { name: 'dynasty-timeline', params: { id: props.id } } : null))

// The Artistic Introduction theme and the exhibitions legacy's client linked
// for the dynasty: its editors' choice, kept in this site's own
// configuration (src/dynasties/links.json, dynasty id → theme and
// exhibition ids), each opening its mini-site in a new window.
const links = computed(() => dynastyLinks[props.id] ?? {})
const theme = computed(() => {
  const at = artIntroRoot.value && links.value.artisticIntroduction
    ? artIntroPosition(artIntroRoot.value.id, links.value.artisticIntroduction)
    : 0
  return at > 0 ? artIntroHref(locale.value, { theme: at, page: 1 }) : null
})
const exhibitions = computed(() => (links.value.exhibitions ?? [])
  .map((exhibitionId) => ({
    id: exhibitionId,
    href: minisiteHref(exhibitionId, locale.value),
    label: tr('collections', exhibitionId).title,
  }))
  .filter((exhibition) => exhibition.href && exhibition.label))

// The languages the dynasty's text is in, by code as legacy's bar lists
// them (العربية, English, Español, Français); a click reads it in that one.
const offered = computed(() => config.navigation?.languages ?? [])
watch(offered, (list) => list.forEach(({ code }) => pkg.loadTranslations('dynasties', code)), { immediate: true })
const languages = computed(() => offered.value
  .filter(({ code }) => pkg.tr('dynasties', props.id, code)?.name)
  .sort((a, b) => a.code.localeCompare(b.code)))

// The glossary terms of the history, in the language its text is in (the
// translation's `glossary_ids`, built by the inventory's glossary jobs):
// each spelling in the text is a link, and a click opens legacy's box over
// the word — its heading on the world map, the spelling, the definition and
// a close button; under 975px, centred on the page below the click. One box
// at a time; another term replaces it.
const textLanguage = computed(() => (pkg.tr('dynasties', props.id, locale.value)?.name ? locale.value : 'en'))
watch(textLanguage, (language) => pkg.loadTranslations('glossary', language), { immediate: true })
const glossaryIndex = byId('glossary')
const terms = computed(() => glossaryTermsFor(text.value, textLanguage.value, { translations: pkg.translations, byId: glossaryIndex.value }))
const glossary = computed(() => glossaryEntries(terms.value))
const popup = useGlossaryPopup(terms)
const at = ref(null)
function openTerm(event) {
  popup.onClick(event)
  if (!popup.active.value) return
  at.value = window.innerWidth <= 974
    ? { top: `${event.pageY}px`, left: '50%', transform: 'translateX(-50%)' }
    : { top: `${event.pageY}px`, left: `${event.pageX}px`, transform: 'translate(-50%, -110%)' }
}
// Legacy showed the spelling as its glossary writes it, not as the text does.
const word = computed(() => {
  const active = popup.active.value
  if (!active) return ''
  const clicked = active.spelling.toLowerCase()
  return terms.value.find((term) => term.id === active.id)?.spellings.find((s) => s.toLowerCase() === clicked) ?? active.spelling
})
const worldMap = computed(() => `url(${chromeSource(config.chrome, 'legacy/hcr_header.jpg')})`)

// In Arabic the texts and the box run right to left, as legacy's did, and
// the box's links within the client turn their arrow back (its reply icon,
// at 75% and 4px before the words).
const rtl = computed(() => isRtl(locale.value))
const inward = computed(() => (rtl.value ? REPLY : SHARE))
</script>

<template>
  <DynastiesFrame>
    <div class="dyn-profile">
      <div class="dyn-profile__wrapper">
        <div v-if="languages.length" class="dyn-profile__languages">
          <button
            v-for="option in languages"
            :key="option.code"
            type="button"
            class="dyn-profile__language"
            :class="{ 'dyn-profile__language--selected': option.code === locale }"
            :lang="option.code"
            @click="locale = option.code"
          >{{ option.label }}</button>
        </div>
        <div v-if="dynasty" class="dyn-profile__body">
          <DynastiesBack />
          <div class="dyn-profile__info" :dir="rtl ? 'rtl' : 'ltr'">
            <div class="dyn-profile__name dyn-profile__gap">
              <span v-html="mdInline(removeEndingPoint(text.name ?? ''))"></span>
              <template v-if="text.also_known_as"><br />{{ $t('islamicart.home.alsoKnownAs') }} <span v-html="mdInline(text.also_known_as)"></span></template>
            </div>
            <div v-if="dateLine(text)" class="dyn-profile__dates">{{ dateLine(text) }}</div>
            <div v-if="text.area" class="dyn-profile__area dyn-profile__gap" v-html="mdInline(text.area)"></div>
            <div v-if="text.history" class="dyn-profile__history" @click="openTerm" v-html="md(text.history, { glossary })"></div>
          </div>

          <div class="dyn-related" :dir="rtl ? 'rtl' : 'ltr'">
            <div class="dyn-related__header">{{ $t('islamicart.item.relatedContent') }}</div>
            <div v-if="objects">
              <RouterLink :to="{ name: 'dynasty-related', params: { id, kind: 'objects' } }">
                <svg class="dyn-icon" :class="{ 'dyn-related__inward--rtl': rtl }" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="inward" /></svg>
                {{ $t('islamicart.item.relatedObjects') }}
              </RouterLink>
            </div>
            <div v-if="monuments" class="dyn-related__gap">
              <RouterLink :to="{ name: 'dynasty-related', params: { id, kind: 'monuments' } }">
                <svg class="dyn-icon" :class="{ 'dyn-related__inward--rtl': rtl }" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="inward" /></svg>
                {{ $t('islamicart.item.relatedMonuments') }}
              </RouterLink>
            </div>
            <div v-if="timeline" class="dyn-related__gap">
              <RouterLink :to="timeline">
                <svg class="dyn-icon" :class="{ 'dyn-related__inward--rtl': rtl }" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="inward" /></svg>
                {{ $t('islamicart.nav.timeline') }}
              </RouterLink>
            </div>
            <div v-if="theme" class="dyn-related__gap">
              <a :href="theme" target="_blank">
                <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="UP_RIGHT_FROM_SQUARE" /></svg>
                {{ $t('islamicart.nav.artisticIntroduction') }}
              </a>
            </div>
            <div v-if="exhibitions.length">
              <div class="dyn-related__exhibitions">{{ $t('islamicart.nav.exhibitions') }}</div>
              <div v-for="exhibition in exhibitions" :key="exhibition.id">
                <a :href="exhibition.href" target="_blank">
                  <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="UP_RIGHT_FROM_SQUARE" /></svg>
                  {{ exhibition.label }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="popup.active.value" class="dyn-glossary" :style="at" :dir="rtl ? 'rtl' : 'ltr'">
        <button type="button" class="dyn-glossary__close" :aria-label="$t('record.glossary.close')" @click="popup.close">
          <svg class="dyn-icon" viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="XMARK" /></svg>
        </button>
        <div class="dyn-glossary__header" :style="{ backgroundImage: worldMap }">{{ $t('record.glossary.heading') }}</div>
        <div class="dyn-glossary__entry">
          <div class="dyn-glossary__word">{{ word }}</div>
          <div class="dyn-glossary__definition" v-html="md(popup.active.value.definition)"></div>
        </div>
      </div>
    </Teleport>
  </DynastiesFrame>
</template>

<style scoped>
.dyn-profile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: #fff;
}

.dyn-profile__wrapper {
  width: 100%;
  min-height: 500px;
}

.dyn-profile__languages {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: #e0b700;
}

.dyn-profile__language {
  padding: 4px 8px;
  font-size: 95%;
  color: #222;
  background-color: transparent;
  border: none;
  outline: none;
  cursor: pointer;
}

.dyn-profile__language--selected {
  background-color: #ffd500;
}

.dyn-profile__body {
  position: relative;
  padding: 60px;
}

.dyn-profile__info {
  width: 60%;
  line-height: 22px;
  color: #222;
}

.dyn-profile__gap {
  margin-bottom: 20px;
}

.dyn-profile__name {
  font-weight: 700;
}

.dyn-profile__area {
  font-style: italic;
}

/* The history's paragraphs follow one another (legacy's <br>). */
.dyn-profile__history :deep(p) {
  margin: 0;
}

/* Legacy's glossary links: blue, underlined on hover. */
.dyn-profile__history :deep(.gloss-term) {
  color: blue;
  cursor: pointer;
}

.dyn-profile__history :deep(.gloss-term:hover) {
  text-decoration: underline;
}

.dyn-related {
  position: absolute;
  top: 0;
  right: 0;
  width: 25%;
  padding: 20px 20px 40px;
  line-height: 150%;
  color: #222;
  background-color: #ffd500;
}

.dyn-related a {
  color: #222;
  text-decoration: none;
}

.dyn-related a:hover {
  text-decoration: underline;
}

.dyn-related__header {
  margin: 30px 0 10px;
  font-size: 110%;
  font-weight: 700;
  text-decoration: underline;
  text-transform: uppercase;
}

.dyn-related__gap {
  margin-bottom: 10px;
}

.dyn-related__exhibitions {
  margin-bottom: 2px;
  font-weight: 700;
}

.dyn-related__inward--rtl {
  padding-right: 4px;
  font-size: 75%;
  box-sizing: content-box;
}

.dyn-glossary {
  position: absolute;
  z-index: 68;
  width: 400px;
  color: #fff;
  background-color: #e0b700;
  border-radius: 10px;
}

.dyn-glossary__close {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: -10px;
  right: -15px;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: inherit;
  color: #222;
  background-color: #ffd500;
  border: none;
  border-radius: 100%;
  cursor: pointer;
}

.dyn-glossary__header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 60px;
  padding: 0 15px;
  font-size: 110%;
  font-weight: 700;
  color: #222;
  background-color: #e0b700;
  background-position: 100%;
  background-repeat: no-repeat;
  background-size: contain;
  border-radius: 10px 10px 0 0;
}

.dyn-glossary__entry {
  position: relative;
  max-height: 150px;
  margin: 0 15px 15px;
  overflow: auto;
  color: #222;
  background-color: #fff;
}

.dyn-glossary__word {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 40px;
  padding: 0 15px;
  color: #222;
  background-color: #f0ede4;
}

.dyn-glossary__definition {
  padding: 15px;
}

.dyn-glossary__definition :deep(p) {
  margin: 0;
}

@media (max-width: 1249px) {
  .dyn-related { width: 30%; }
}

@media (max-width: 974px) {
  .dyn-profile__info {
    width: 100%;
    margin-bottom: 30px;
  }

  .dyn-related {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    margin-bottom: 50px;
  }

  .dyn-related__header { font-size: 105%; }
}

@media (max-width: 499px) {
  .dyn-glossary { width: 350px; }
}

@media (max-width: 399px) {
  .dyn-glossary { width: 250px; }
}
</style>
