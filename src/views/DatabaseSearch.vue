<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { I18nTextInline, SEARCH_LANGUAGE_KEY, centuryPresets, useI18n, useSearchLanguage } from '@museumwnf/viewer-core'
import { StandaloneDatabaseForm } from '@museumwnf/viewer-layout/standalone'

// The Database entrance as legacy's database.php, the standalone family's
// form (viewer-layout's `StandaloneDatabaseForm`): three keyword rows, each
// searched in a category, the century range, the search language, Go and
// the portal's complete listing. Islamic Art's own: Explore Islamic Art
// Collections' opt-in under the language, and "Glossary & Spelling" in the
// last column, which opens legacy's window (GlossarySpelling.vue) at its
// size. Go writes the query the results page reads (DatabaseResults.vue,
// composables/search.js). Every word is legacy's own (islamicart.db.*, its
// translation table).

const router = useRouter()
const { t, locale } = useI18n()
const { languages, language } = useSearchLanguage('items')

const labels = computed(() => ({
  criteria: t('islamicart.db.criteria'),
  keywords: t('islamicart.db.keywords'),
  category: t('islamicart.db.category'),
  in: t('islamicart.db.in'),
  and: t('islamicart.db.and'),
  or: t('islamicart.db.or'),
  date: t('islamicart.db.date'),
  from: t('islamicart.db.from'),
  to: t('islamicart.db.to'),
  language: t('islamicart.db.language'),
  go: t('islamicart.db.go'),
  listing: t('islamicart.db.listing'),
  listingTooltip: t('islamicart.db.listingTooltip'),
}))

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
const epm = ref(false)

function go({ rows, from, to }) {
  const query = {}
  rows.forEach((row, index) => {
    if (!row.keyword) return
    const n = index === 0 ? '' : String(index + 1)
    query[`q${n}`] = row.keyword
    query[`field${n}`] = row.field
    if (index) query[`op${n}`] = row.cond
  })
  if (from) query.from = String(from)
  if (to) query.to = String(to)
  if (language.value) query[SEARCH_LANGUAGE_KEY] = language.value
  if (epm.value) query.epm = '1'
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
  <StandaloneDatabaseForm
    v-model:language="language"
    :labels="labels"
    :fields="FIELDS"
    :from-years="FROM_YEARS"
    :to-years="TO_YEARS"
    :languages="searchLanguages"
    :listing-href="LISTING"
    @search="go"
  >
    <template #aside>
      <a :href="glossaryHref" :title="t('islamicart.glossary.tooltip')" @click.prevent="openGlossary">{{ t('islamicart.glossary.heading') }}</a>
    </template>
    <template #options>
      <label class="islamicart-db-epm" :title="t('islamicart.db.epmTooltip')">
        <input v-model="epm" type="checkbox" />&nbsp;<I18nTextInline keypath="islamicart.db.epm" />
      </label>
    </template>
  </StandaloneDatabaseForm>
</template>
