<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { PartnerPanel, RecordLanguages, RelatedRecords } from '@museumwnf/viewer-layout/content'
import { RecordView } from '@museumwnf/viewer-layout/views'
import { permanentCollection } from '../composables/catalogue.js'
import { useInventoryData } from '../composables/useInventoryData.js'
import { partnerObjectsLink, partnerSheet, partnerViewOf } from '../composables/partner.js'

// The partner profile: the platform's composed record page (the record's
// language, its load, the not-found case), with viewer-layout's
// `PartnerPanel` as its body — the name and location, the About/Contact/
// Logo tabs and the homepage link (decision D2, inventory-app#2035), the
// pictures, the map. What is this website's: the way back and the record's
// languages, the type badge, the "View Objects/Monuments" action counted
// from the package's own `item_count` (never a scan of every item), the map
// for a museum only (legacy never mapped an institution, which may cover a
// whole country's monuments), and the held items under the panel.

defineProps({ id: { type: String, required: true } })

const router = useRouter()
const { items } = useInventoryData()

function back() {
  if (window.history.length > 2) router.back()
  else router.push('/partners')
}

const { t } = useI18n()

function viewItemsLabel(record) {
  return record.type === 'institution' ? t('partner.action.viewMonuments') : t('partner.action.viewObjects')
}

function partnerTypeLabel(record) {
  return record.type === 'institution' ? t('partner.info.typeInstitution') : t('partner.info.typeMuseum')
}

// The held items, in the Permanent Collection's own row shape
// (composables/catalogue.js) — the reverse of `item.partner_id`, since a
// partner carries no forward list of the items it holds.
function heldItems(record) {
  return items.value.filter((i) => i.partner_id === record.id).map(permanentCollection.record)
}
</script>

<template>
  <RecordView :spec="partnerSheet" :id="id" class="detail mwnf-panel">
    <template #header="{ language, languages, select }">
      <a class="mwnf-back-bar" href="#" @click.prevent="back">← {{ $t('partner.nav.back') }}</a>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
    </template>

    <template #before-sheet="{ record, text, dir }">
      <PartnerPanel
        variant="full"
        :partner="partnerViewOf(record, text)"
        :heading="1"
        :show="{ map: record.type === 'museum' }"
        :dir="dir"
      >
        <template #badge>
          <div><span class="detail-type-badge">{{ partnerTypeLabel(record) }}</span></div>
        </template>
        <template #actions>
          <RouterLink v-if="record.item_count" :to="partnerObjectsLink(record)" class="mwnf-button">
            {{ viewItemsLabel(record) }} ({{ record.item_count }}) →
          </RouterLink>
        </template>
      </PartnerPanel>
    </template>

    <template #related="{ record }">
      <RelatedRecords
        v-if="heldItems(record).length"
        :heading="$t('record.related.items')"
        :records="heldItems(record)"
        variant="list"
      />
    </template>
  </RecordView>
</template>

<style scoped>
.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--heading);
  border: 1px solid var(--accent-dark);
  padding: 2px 8px;
  font-family: 'Roboto', sans-serif;
}
</style>
