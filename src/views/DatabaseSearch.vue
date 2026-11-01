<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { I18nTextInline, SEARCH_LANGUAGE_KEY, centuryPresets, useI18n, useSearchLanguage } from '@museumwnf/viewer-core'

// The Database entrance as legacy's database.php: three keyword rows, each
// searched in a category, the second and third joined by "and"/"or"; the
// century range; the search language; Explore Islamic Art Collections'
// opt-in; Go; then the link to the portal's complete listing. Legacy's
// Bootstrap row (col-md-1, col-md-2 for the joins and the labels, col-md-6
// for the form, col-md-3) is laid out as a grid, mirrored in Arabic as
// legacy's own Arabic form was. Go writes the query the results page reads
// (DatabaseResults.vue, composables/search.js). Every word is legacy's own
// (islamicart.db.*, its translation table). "Glossary & Spelling", in the
// last column, opens legacy's window (GlossarySpelling.vue) at its size.

const router = useRouter()
const { t, locale } = useI18n()
const { languages, language } = useSearchLanguage('items')

const FIELDS = computed(() => [
  { value: 'keyword', label: t('islamicart.dbField.keyword') },
  { value: 'name', label: t('islamicart.dbField.name') },
  { value: 'location', label: t('islamicart.dbField.location') },
  { value: 'provenance', label: t('islamicart.dbField.provenance') },
  { value: 'dynasty', label: t('islamicart.dbField.dynasty') },
  { value: 'patron', label: t('islamicart.dbField.patron') },
  { value: 'artist', label: t('islamicart.dbField.artist') },
  { value: 'material', label: t('islamicart.dbField.material') },
  { value: 'other', label: t('islamicart.dbField.other') },
])

// Legacy's search languages, named in the page's language (in English where
// its table had no name), those the package carries.
const LANGUAGE_NAMES = computed(() => ({
  ar: t('islamicart.dbLang.ar'),
  de: t('islamicart.dbLang.de'),
  el: t('islamicart.dbLang.el'),
  en: t('islamicart.dbLang.en'),
  es: t('islamicart.dbLang.es'),
  fr: t('islamicart.dbLang.fr'),
  he: t('islamicart.dbLang.he'),
  it: t('islamicart.dbLang.it'),
  pt: t('islamicart.dbLang.pt'),
  se: t('islamicart.dbLang.se'),
  tr: t('islamicart.dbLang.tr'),
}))
const searchLanguages = computed(() =>
  languages.value.filter((code) => code in LANGUAGE_NAMES.value).map((code) => ({ code, name: LANGUAGE_NAMES.value[code] })),
)

const { from: FROM_YEARS, to: TO_YEARS } = centuryPresets()

const rows = reactive([
  { keyword: '', field: 'keyword', cond: 'AND' },
  { keyword: '', field: 'keyword', cond: 'AND' },
  { keyword: '', field: 'keyword', cond: 'AND' },
])
const form = reactive({ from: '', to: '', epm: false })

function go() {
  const query = {}
  rows.forEach((row, index) => {
    if (!row.keyword.trim()) return
    const n = index === 0 ? '' : String(index + 1)
    query[`q${n}`] = row.keyword.trim()
    query[`field${n}`] = row.field
    if (index) query[`op${n}`] = row.cond
  })
  if (form.from) query.from = String(form.from)
  if (form.to) query.to = String(form.to)
  if (language.value) query[SEARCH_LANGUAGE_KEY] = language.value
  if (form.epm) query.epm = '1'
  return router.push({ name: 'database-results', query })
}

const LISTING = 'https://www.museumwnf.org/database_searchform.php'

// Legacy's openWindow('glossarysearch.php', 'languagepolicies', …): one
// window, reused, 700 by 600.
const glossaryHref = computed(() => router.resolve({ name: 'glossary-spelling', query: { lang: locale.value } }).href)
function openGlossary() {
  window.open(glossaryHref.value, 'languagepolicies', 'scrollbars=no,resizable=no,width=700,height=600')?.focus()
}
</script>

<template>
  <form class="islamicart-db" @submit.prevent="go">
    <h3 class="islamicart-db__criteria">{{ t('islamicart.db.criteria') }}</h3>
    <p class="islamicart-db__head islamicart-db__head--keywords">{{ t('islamicart.db.keywords') }}</p>
    <p class="islamicart-db__head islamicart-db__head--category">{{ t('islamicart.db.category') }}</p>
    <p class="islamicart-db__glossary">
      <a :href="glossaryHref" :title="t('islamicart.glossary.tooltip')" @click.prevent="openGlossary">{{ t('islamicart.glossary.heading') }}</a>
    </p>

    <template v-for="(row, index) in rows" :key="index">
      <select
        v-if="index"
        v-model="row.cond"
        class="islamicart-db__cond"
        :class="`islamicart-db__row-${index + 1}`"
        :aria-label="`${t('islamicart.db.and')} / ${t('islamicart.db.or')}`"
      >
        <option value="AND">{{ t('islamicart.db.and') }}</option>
        <option value="OR">{{ t('islamicart.db.or') }}</option>
      </select>
      <input
        v-model="row.keyword"
        type="text"
        class="islamicart-db__keyword"
        :class="`islamicart-db__row-${index + 1}`"
        :aria-label="t('islamicart.db.keywords')"
      />
      <label class="islamicart-db__field" :class="`islamicart-db__row-${index + 1}`">
        <span>{{ t('islamicart.db.in') }}</span>
        <select v-model="row.field">
          <option v-for="field in FIELDS" :key="field.value" :value="field.value">{{ field.label }}</option>
        </select>
      </label>
    </template>

    <span class="islamicart-db__label islamicart-db__label--date">{{ t('islamicart.db.date') }}</span>
    <p class="islamicart-db__dates">
      <select v-model="form.from" :aria-label="`${t('islamicart.db.date')} ${t('islamicart.db.from')}`">
        <option value="">{{ t('islamicart.db.from') }}</option>
        <option v-for="year in FROM_YEARS" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="form.to" :aria-label="`${t('islamicart.db.date')} ${t('islamicart.db.to')}`">
        <option value="">{{ t('islamicart.db.to') }}</option>
        <option v-for="year in TO_YEARS" :key="year" :value="year">{{ year }}</option>
      </select>
    </p>

    <span class="islamicart-db__label islamicart-db__label--language">{{ t('islamicart.db.language') }}</span>
    <p class="islamicart-db__language">
      <select v-model="language" :aria-label="t('islamicart.db.language')">
        <option value=""></option>
        <option v-for="option in searchLanguages" :key="option.code" :value="option.code">{{ option.name }}</option>
      </select>
    </p>

    <p class="islamicart-db__epm">
      <label :title="t('islamicart.db.epmTooltip')">
        <input v-model="form.epm" type="checkbox" />&nbsp;<I18nTextInline keypath="islamicart.db.epm" />
      </label>
    </p>
    <p class="islamicart-db__go"><button type="submit">{{ t('islamicart.db.go') }}</button></p>
    <p class="islamicart-db__listing">
      <a :href="LISTING" :title="t('islamicart.db.listingTooltip')">{{ t('islamicart.db.listing') }}</a>
    </p>
  </form>
</template>
