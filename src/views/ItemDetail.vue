<script setup>
import { timelineLinkFor } from '@museumwnf/viewer-core'
import {
  BackLink, DynastyList, OnDisplayIn, PartnerPanel, RecordLanguages, RelatedMedia, SpecialFeatures,
} from '@museumwnf/viewer-layout/content'
import { RecordView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { artIntroLinksForItem } from '../composables/artIntro.js'
import { exhibitionLinksForItem } from '../composables/exhibitions.js'
import { partnerViewOf } from '../composables/partner.js'
import { itemSheet } from '../composables/sheet.js'

// The item sheet is the platform's composed record page, rendering the spec
// in composables/sheet.js. What is this website's fills the page's slots:
// the header — the way back, the timeline link, the type badge — the holding
// museum's partner line, and, after the sheet, the platform's item-page
// blocks fed with this website's records: a monument's special features, the
// related media, the dynasty popouts, the Artistic Introduction themes, the
// exhibitions the item is on display in, the THG galleries.

defineProps({ id: { type: String, required: true } })

const { dynastyById, mdInline, partnerById, tr } = useData()

const timelineLink = (record) => timelineLinkFor(record, { name: 'timeline-results' })

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

// Decision D5: the dynasty popout — legacy's `dynasty.php` popup, and the
// DXA sites' own shape. `DynastyList` reads the record's own dynasties and
// resolves each one's translation itself, through `tr` below.
function itemDynasties(record) {
  return (record.dynasty_ids ?? []).map((id) => dynastyById.value.get(id)).filter(Boolean)
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
  <RecordView :spec="itemSheet" :id="id" class="detail mwnf-panel">
    <template #header="{ record, text, language, languages, select, dir, glossary }">
      <div class="detail-top">
        <BackLink variant="bar" label="record.action.backToResults" :to="{ name: 'home' }" />
        <RouterLink v-if="timelineLink(record)" :to="timelineLink(record)" class="mwnf-back-bar mwnf-back-bar--link">{{ $t('record.action.viewOnTimeline') }} →</RouterLink>
      </div>
      <!-- In a block of its own: the view lays the header out as a column,
           and a badge placed directly in it would stretch to the full width. -->
      <div><span class="detail-type-badge">{{ record.type }}</span></div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
      <h1 class="detail-title" :dir="dir" v-html="mdInline(text.name ?? record.internal_name ?? record.id, { glossary })"></h1>
    </template>

    <template #holder="{ row, record, language, dir, glossary }">
      <span v-html="mdInline(row.value, { glossary })"></span>
      <template v-for="partner in [holderPartner(record, language)]" :key="'holder-partner'">
        <PartnerPanel v-if="partner" variant="summary" :partner="partner" label="partner.info.about" :dir="dir" />
      </template>
    </template>

    <template #after-sheet="{ record, language, dir, glossary }">
      <SpecialFeatures
        :features="record.details ?? []"
        :tr="(feature) => tr('items', feature.id, language)"
        :language="language"
        :glossary="glossary"
        :dir="dir"
      />
      <RelatedMedia :media="record.media ?? []" :language="language" heading="record.related.video" :dir="dir" />
      <DynastyList
        v-if="itemDynasties(record).length"
        :heading="$t('sheet.field.dynasties')"
        :dynasties="itemDynasties(record)"
        :tr="(d) => tr('dynasties', d.id, language)"
        :dir="dir"
      />
      <OnDisplayIn heading="core.nav.artisticIntroduction" :groups="artIntroGroups(record)" :dir="dir" />
      <OnDisplayIn :groups="onDisplayInGroups(record)" :dir="dir" />
      <OnDisplayIn heading="record.related.galleries" :groups="thgGalleryGroups(record)" :dir="dir" />
    </template>
  </RecordView>
</template>

<style scoped>
.detail-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }

.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--heading);
  border: 1px solid var(--accent-dark);
  padding: 2px 8px;
  margin-bottom: 10px;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--heading);
  margin: 10px 0 16px;
  line-height: 1.3;
}

.detail :deep(.mwnf-media) { margin-bottom: 20px; }
.detail :deep(.mwnf-sheet) { margin-bottom: 20px; }
</style>
