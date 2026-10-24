<script setup>
import { timelineLinkFor } from '@museumwnf/viewer-core'
import {
  DynastyList, OnDisplayIn, PartnerPanel, RelatedMedia, SpecialFeatures,
} from '@museumwnf/viewer-layout/content'
import { StandaloneItemSheet } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { artIntroLinksForItem } from '../composables/artIntro.js'
import { exhibitionLinksForItem } from '../composables/exhibitions.js'
import { partnerViewOf } from '../composables/partner.js'
import { itemSheetSpec } from '../composables/sheet.js'

// The item sheet: legacy database_item.php in its three columns, the
// standalone family's `StandaloneItemSheet` over the spec in
// composables/sheet.js. What is this website's fills its slots: the holding
// museum's partner line in the sheet, a monument's special features under
// it, and, in the Related Content column, legacy's blocks in legacy's order
// — the Artistic Introduction themes, the timeline for this item, the
// dynasties, the related videos, then where the item is on display (the
// exhibitions and the THG galleries).

defineProps({ id: { type: String, required: true } })

const { dynastyById, mdInline, partnerById, tr, translations } = useData()

const timelineLink = (record) => timelineLinkFor(record, { name: 'timeline-results' })

// The way back, as legacy's breadcrumbs: the previous page, then the
// collection's start page.
const back = [
  { label: 'islamicart.item.back', history: true },
  { label: 'islamicart.item.collectionStart', to: { name: 'permanent-collection' } },
]

// Related Content's own parts: the related records by type, and Download,
// which legacy offered as the browser's print ("As PDF").
const related = {
  heading: 'islamicart.item.relatedContent',
  groups: [
    { heading: 'islamicart.item.relatedObjects', type: 'object' },
    { heading: 'islamicart.item.relatedMonuments', type: 'monument' },
  ],
  download: { heading: 'islamicart.item.download', print: 'islamicart.item.asPdf' },
}

// The holding museum (decision D3, inventory-app#2035): the item's holder
// text, then the partner it refers to as `PartnerPanel`'s summary — "About
// {name}, {city}, {country}", linked to the partner's page. Legacy showed
// no such link for an associated museum (`associated_museums`, the
// package's `level: 'associated_partner'`), and neither does this page.
function holderPartner(record, language) {
  const partner = partnerById.value.get(record.partner_id)
  if (!partner || partner.level === 'associated_partner') return null
  return partnerViewOf(partner, tr('partners', partner.id, language))
}

// Decision D5: the dynasty popout — legacy's `dynasty.php` popup. `DynastyList`
// reads the record's own dynasties and resolves each one's translation itself,
// through `tr` below. Only the ones with a text in the sheet's language: the
// popup read dynasty_texts in that language and had nothing for the others.
function itemDynasties(record, language) {
  return (record.dynasty_ids ?? [])
    .map((id) => dynastyById.value.get(id))
    .filter((dynasty) => dynasty && translations('dynasties', language)[dynasty.id]?.name)
}

const artIntroGroups = (record) => [{
  links: artIntroLinksForItem(record.id).map((l) => ({
    id: l.themeId,
    label: mdInline(l.label),
    to: { name: 'artistic-introduction-theme', params: { themeId: l.themeId } },
  })),
}]

const onDisplayInGroups = (record) => [{
  links: exhibitionLinksForItem(record.id).map((l) => ({
    label: mdInline(l.label),
    to: l.themeId
      ? { name: 'exhibition-theme', params: { exhibitionId: l.exhibitionId, themeId: l.themeId } }
      : { name: 'exhibition-introduction', params: { exhibitionId: l.exhibitionId } },
  })),
}]

// The THG galleries, by name: the package carries no address for them yet,
// and the legacy page's same-page anchors lead nowhere in this one.
const thgGalleryGroups = (record) => [{
  links: (record.thg_galleries ?? []).map((g) => ({ id: g.name, label: mdInline(g.name) })),
}]
</script>

<template>
  <StandaloneItemSheet :spec="itemSheetSpec" :id="id" :back="back" :related="related">
    <template #holder="{ row, record, language, dir, glossary }">
      <span v-html="mdInline(row.value, { glossary })"></span>
      <PartnerPanel
        v-if="holderPartner(record, language)"
        variant="summary"
        :partner="holderPartner(record, language)"
        label="partner.info.about"
        :dir="dir"
      />
    </template>

    <template #after-sheet="{ record, language, dir, glossary }">
      <SpecialFeatures
        :features="record.details ?? []"
        :tr="(feature) => tr('items', feature.id, language)"
        :language="language"
        :glossary="glossary"
        :dir="dir"
        :picture-limit="6"
      />
    </template>

    <template #sidebar="{ record, language, dir }">
      <OnDisplayIn heading="islamicart.nav.artisticIntroduction" :groups="artIntroGroups(record)" :dir="dir" />
      <p v-if="timelineLink(record)" class="islamicart-timeline-link">
        <RouterLink :to="timelineLink(record)">{{ $t('islamicart.item.timeline') }}</RouterLink>
      </p>
      <DynastyList
        v-if="itemDynasties(record, language).length"
        :heading="$t('islamicart.item.dynasties')"
        :dynasties="itemDynasties(record, language)"
        :tr="(d) => translations('dynasties', language)[d.id] ?? {}"
        :dir="dir"
      />
      <RelatedMedia :media="record.media ?? []" :language="language" heading="islamicart.item.relatedVideos" :dir="dir" />
      <p v-if="onDisplayInGroups(record)[0].links.length || thgGalleryGroups(record)[0].links.length" class="islamicart-on-display">
        <strong><u>{{ $t('islamicart.item.onDisplayIn') }}</u></strong>
      </p>
      <OnDisplayIn heading="islamicart.item.exhibitions" :groups="onDisplayInGroups(record)" :dir="dir" />
      <OnDisplayIn heading="islamicart.item.galleries" :groups="thgGalleryGroups(record)" :dir="dir" />
    </template>
  </StandaloneItemSheet>
</template>
