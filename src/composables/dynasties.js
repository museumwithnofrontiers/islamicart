import { computed, watch } from 'vue'
import { removeEndingPoint, useDataPackage, useI18n } from '@museumwnf/viewer-core'
import { useData } from './data.js'

// The Islamic Dynasties section (Pascal, 2026-10-20: a feature of Islamic Art,
// rebuilt from the data package, as legacy's /dynasties/ client presents it).
// The dynasties and their texts are the package's — `dynasties.json` and
// `translations/dynasties.<lang>.json` (name, also known as, the two date
// lines, the area, the history) — read in the language the site is in, with
// English where a language has no text, as legacy's client fell back.

export function useDynasties() {
  const { locale } = useI18n()
  const pkg = useDataPackage()
  const { dynasties, items } = useData()

  watch(locale, (language) => pkg.loadTranslations('dynasties', language), { immediate: true })

  const textOf = (id) => pkg.tr('dynasties', id, locale.value, 'en')

  // The picker's list: every dynasty, by name in the site's language.
  const list = computed(() => (dynasties.value ?? [])
    .map((dynasty) => ({ id: dynasty.id, name: removeEndingPoint(textOf(dynasty.id).name ?? '') }))
    .filter((dynasty) => dynasty.name)
    .sort((a, b) => a.name.localeCompare(b.name, locale.value)))

  // Legacy's date line: the Hijri and the Gregorian dates, as the record
  // writes them, one after the other.
  const dateLine = (text) => [text.date_description_ah, text.date_description_ad].filter(Boolean).join(' / ')

  // The records linked to a dynasty, by type.
  const recordsOf = (id, type) => (items.value ?? []).filter((item) => item.type === type && (item.dynasty_ids ?? []).includes(id))

  return { dynasties, list, textOf, dateLine, recordsOf }
}
