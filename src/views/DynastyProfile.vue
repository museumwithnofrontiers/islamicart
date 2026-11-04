<script setup>
import { computed, watch } from 'vue'
import { isRtl, md, mdInline, removeEndingPoint, useDataPackage, useI18n, useSiteConfig } from '@museumwnf/viewer-core'
import { useDynasties } from '../composables/dynasties.js'
import DynastiesBack from '../dynasties/DynastiesBack.vue'
import DynastiesFrame from '../dynasties/DynastiesFrame.vue'
import { REPLY, SHARE, UP_RIGHT_FROM_SQUARE } from '../dynasties/icons.js'

// A dynasty's profile, as legacy's client draws it: the languages its text
// is in, over the page; the way back, the name, "Also known as", the date
// line, the area in italics and the history; and, at the top right, the
// Related Content box: its objects and monuments, the timeline of its period,
// and the Artistic Introduction.
//
// Legacy's client also linked one Artistic Introduction theme and the
// exhibitions of some dynasties; the data package carries neither link, so
// the box links the Artistic Introduction itself and no exhibitions.
const props = defineProps({ id: { type: String, required: true } })
const { locale } = useI18n()
const pkg = useDataPackage()
const config = useSiteConfig()
const { dynasties, textOf, dateLine, recordsOf } = useDynasties()

const dynasty = computed(() => (dynasties.value ?? []).find((d) => d.id === props.id) ?? null)
const text = computed(() => (dynasty.value ? textOf(dynasty.value.id) : {}))
const objects = computed(() => recordsOf(props.id, 'object').length)
const monuments = computed(() => recordsOf(props.id, 'monument').length)
// The client's own timeline of the dynasty's years (DynastyTimeline.vue).
const timeline = computed(() => (dynasty.value?.from_ad != null ? { name: 'dynasty-timeline', params: { id: props.id } } : null))

// The languages the dynasty's text is in, by code as legacy's bar lists
// them (العربية, English, Español, Français); a click reads it in that one.
const offered = computed(() => config.navigation?.languages ?? [])
watch(offered, (list) => list.forEach(({ code }) => pkg.loadTranslations('dynasties', code)), { immediate: true })
const languages = computed(() => offered.value
  .filter(({ code }) => pkg.tr('dynasties', props.id, code)?.name)
  .sort((a, b) => a.code.localeCompare(b.code)))

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
            <div v-if="text.history" class="dyn-profile__history" v-html="md(text.history)"></div>
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
            <div class="dyn-related__gap">
              <RouterLink :to="{ name: 'artistic-introduction' }">
                <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="UP_RIGHT_FROM_SQUARE" /></svg>
                {{ $t('islamicart.nav.artisticIntroduction') }}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
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

.dyn-related__inward--rtl {
  padding-right: 4px;
  font-size: 75%;
  box-sizing: content-box;
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
</style>
