import { removeEndingPoint } from '@museumwnf/viewer-core'

// The item sheet, as a spec: what viewer-layout's `RecordView` renders on
// `/item/:id`. The mechanics — which language the record is read in, what is
// loaded for it, the glossary terms it reaches, how a field becomes a row,
// the credits, the citation, the related records — are the platform's. What
// is declared here is only what is this website's: the field specification
// (legacy `database_item.php`'s two orders, one for a monument and one for an
// object), the prose sections under it, and the period/dynasty field (read
// from the `dynasties` translations the spec asks for). Every label is an
// entry name, written out so the check that every name resolves can read it.

// The linked dynasties' names in the sheet's language only (RecordView's
// `translations`, which reads no other language): legacy joined dynasty_texts
// on that language, and a dynasty without a text in it was not printed.
const dynastyNames = (c) =>
  (c.record.dynasty_ids ?? [])
    .map((id) => c.translations('dynasties')[id]?.name)
    .filter(Boolean)
    .join(', ')

// Legacy's free-text Period / Dynasty line, without its ending period as
// legacy printed it; the record's linked dynasties stand in when it has none,
// and keep their own popouts (decision D5, inventory-app#2233).
const periodDynasty = (c) => removeEndingPoint(c.text.dynasty) || dynastyNames(c)

// Legacy's Location line: the location and the province without their ending
// period, then the country's name in the sheet's language ("London, England,
// United Kingdom"). Legacy named no country for the Palestinian museum's
// objects (Mus01;pa, this partner) nor for these Palestinian monuments.
const NO_COUNTRY_PARTNER = '325b7505-1527-5442-99ea-6a40f8c43d3f'
const NO_COUNTRY_MONUMENTS = /^PA (01|02|03|04|05|06|07|08|09|10|11|14|18|19|20|21|24|25|26|27|28|29|30|31|32|33|34|35)$/
const namesCountry = (record) =>
  !(record.type === 'object' && record.country_id === 'pse' && record.partner_id === NO_COUNTRY_PARTNER) &&
  !(record.type === 'monument' && record.country_id === 'pse' && NO_COUNTRY_MONUMENTS.test(record.mwnf_reference ?? ''))
const locationWithCountry = (c) =>
  [c.text.location, c.text.province]
    .map((part) => removeEndingPoint(part ?? ''))
    .concat(namesCountry(c.record) ? c.translations('countries')[c.record.country_id]?.name ?? '' : '')
    .filter(Boolean)
    .join(', ')

// Each sheet opens with the record's name, under legacy's own label
// (db_name_monument, db_name_object): the page has no other title.
const monumentFacts = [
  { key: 'name', label: 'islamicart.item.nameOfMonument', value: 'name' },
  { key: 'alsoKnownAs', label: 'sheet.field.alsoKnownAs', value: 'alternate_name' },
  { key: 'location', label: 'sheet.field.location', value: locationWithCountry },
  { key: 'date', label: 'sheet.field.dateOfMonument', value: 'dates' },
  { key: 'architects', label: 'sheet.field.architects', value: 'architects' },
  { key: 'dynasty', label: 'sheet.field.periodDynasty', value: periodDynasty },
  { key: 'patrons', label: 'sheet.field.patrons', value: (c) => c.text.patrons ?? c.text.initial_owner },
]

const objectFacts = [
  { key: 'name', label: 'islamicart.item.nameOfObject', value: 'name' },
  { key: 'alsoKnownAs', label: 'sheet.field.alsoKnownAs', value: 'alternate_name' },
  { key: 'location', label: 'sheet.field.location', value: locationWithCountry },
  // The holder text, then the partner it refers to (`PartnerPanel`'s summary),
  // rendered by ItemDetail.vue's `holder` slot (decision D3).
  { key: 'holder', label: 'sheet.field.holdingMuseum', value: 'holder', render: 'custom' },
  { key: 'date', label: 'sheet.field.dateOfObject', value: 'dates' },
  // The artist line as the page's language writes it, or none: legacy printed
  // each language's own line, and `artist_names` come from one language's.
  { key: 'artists', label: 'sheet.field.artists', value: 'artist' },
  { key: 'scribe', label: 'sheet.field.scribe', value: 'scriber' },
  { key: 'inventoryNumber', label: 'sheet.field.inventoryNumber', value: (c) => c.record.owner_reference },
  // Legacy's Material(s) / Technique(s) line is the record's own materials
  // text, which the package splits at its semicolons (inventory-app#2233,
  // C6). The type of object was never on this sheet.
  { key: 'materials', label: 'sheet.field.materials', value: (c) => c.text.materials, join: '; ' },
  { key: 'dimensions', label: 'sheet.field.dimensions', value: 'dimensions' },
  { key: 'dynasty', label: 'sheet.field.periodDynasty', value: periodDynasty },
  { key: 'provenance', label: 'sheet.field.provenance', value: 'provenance' },
  { key: 'workshop', label: 'sheet.field.workshop', value: 'workshop' },
  { key: 'binding', label: 'sheet.field.binding', value: 'binding_desc' },
  { key: 'currentOwner', label: 'sheet.field.currentOwner', value: 'owner' },
  { key: 'originalOwner', label: 'sheet.field.originalOwner', value: 'initial_owner' },
  { key: 'placeOfProduction', label: 'sheet.field.placeOfProduction', value: 'place_of_production' },
]

// The prose under the facts, in legacy's order and under its headings. The
// item's rights line (`notice_b`, the package's `copyright`) closes both.
const copyright = { key: 'copyright', label: 'sheet.field.copyrightInformation', value: 'copyright' }

const monumentSections = [
  { key: 'history', label: 'sheet.field.history', value: 'history' },
  { key: 'description', label: 'sheet.field.description', value: 'description' },
  { key: 'datation', label: 'sheet.field.monumentDatationMethod', value: 'method_for_datation' },
  { key: 'provenanceMethod', label: 'sheet.field.provenanceMethod', value: 'method_for_provenance' },
  { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
  copyright,
]

const objectSections = [
  { key: 'description', label: 'sheet.field.description', value: 'description' },
  { key: 'datation', label: 'sheet.field.datationMethod', value: 'method_for_datation' },
  { key: 'obtention', label: 'sheet.field.obtentionMethod', value: 'obtention' },
  { key: 'provenanceMethod', label: 'sheet.field.provenanceMethod', value: 'method_for_provenance' },
  { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
  {
    key: 'catalogue',
    label: 'sheet.field.catalogue',
    value: (c) => (c.text.catalogue_holding_link ? `[${c.text.catalogue_holding_link}](${c.text.catalogue_holding_link})` : ''),
  },
  copyright,
]

const isMonument = (ctx) => ctx.record?.type === 'monument'

export const itemSheetSpec = {
  entity: 'items',
  translations: ['dynasties', 'glossary', 'countries'],
  fields: (ctx) => (isMonument(ctx) ? monumentFacts : objectFacts),
  sections: (ctx) => (isMonument(ctx) ? monumentSections : objectSections),
  // Legacy's sheet: each label over its value (modules/database_item.php's
  // h3 and p).
  layout: 'list',
  // Legacy's collapsible short description (`pc_view_sdesc`), folded under
  // the description when the item also carries the shorter text.
  shortDescription: 'short_description',
  shortDescriptionAfter: 'description',
  related: { variant: 'list', heading: 'record.related.items' },
  route: 'item',
  // Legacy's gap under the pictures and under the sheet.
  spaced: true,
}
