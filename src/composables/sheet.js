import { removeEndingPoint, renderInline, renderPlain, useDataPackage } from '@museumwnf/viewer-core'
import { PROJECTS } from '../dataset.config.js'

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

// A field legacy printed without its ending period (removeEndingPoint in
// modules/database_item.php); the others it printed as written.
const plain = (key) => (c) => removeEndingPoint(String(c.text[key] ?? ''))

// Legacy's Location line: the location and the province without their ending
// period, then the country's name in the sheet's language ("London, England,
// United Kingdom"). Legacy named no country for the Palestinian museum's
// objects (Mus01;pa, this partner) nor for these Palestinian monuments.
const NO_COUNTRY_PARTNER = '325b7505-1527-5442-99ea-6a40f8c43d3f'
const NO_COUNTRY_MONUMENTS = /^PA (01|02|03|04|05|06|07|08|09|10|11|14|18|19|20|21|24|25|26|27|28|29|30|31|32|33|34|35)$/
export const namesCountry = (record) =>
  !(record.type === 'object' && record.country_id === 'pse' && record.partner_id === NO_COUNTRY_PARTNER) &&
  !(record.type === 'monument' && record.country_id === 'pse' && NO_COUNTRY_MONUMENTS.test(record.mwnf_reference ?? ''))
const locationWithCountry = (c) =>
  [c.text.location, c.text.province]
    .map((part) => removeEndingPoint(part ?? ''))
    .concat(namesCountry(c.record) ? c.translations('countries')[c.record.country_id]?.name ?? '' : '')
    .filter(Boolean)
    .join(', ')

// A monument's Location line opens with its address, each of its lines on a
// line of its own (legacy's nl2br), then the same parts as an object's. The
// package carries the address apart since inventory-app#2429; a package
// without it prints the line as before.
const addressLines = (address) =>
  removeEndingPoint(String(address ?? '').trim().replace(/\r\n?/g, '\n').replace(/[ \t]*\n/g, '  \n'))
const monumentLocation = (c) => [addressLines(c.text.address), locationWithCountry(c)].filter(Boolean).join(', ')

// The sheet's rows in legacy modules/database_item.php's two orders, each
// under the word legacy printed for it: its `db_` term, word for word in
// every language (islamicart.sheet.*, from legacy's translation table). Each
// sheet opens with the record's name: the page has no other title.
const monumentFacts = [
  { key: 'name', label: 'islamicart.sheet.nameOfMonument', value: plain('name') },
  { key: 'alsoKnownAs', label: 'islamicart.sheet.alsoKnownAs', value: plain('alternate_name') },
  { key: 'location', label: 'islamicart.sheet.location', value: monumentLocation },
  { key: 'date', label: 'islamicart.sheet.dateOfMonument', value: plain('dates') },
  { key: 'architects', label: 'islamicart.sheet.architects', value: 'architects' },
  { key: 'dynasty', label: 'islamicart.sheet.periodDynasty', value: periodDynasty },
  { key: 'patrons', label: 'islamicart.sheet.patrons', value: (c) => c.text.patrons ?? c.text.initial_owner },
]

const objectFacts = [
  { key: 'name', label: 'islamicart.sheet.nameOfObject', value: plain('name') },
  { key: 'alsoKnownAs', label: 'islamicart.sheet.alsoKnownAs', value: plain('alternate_name') },
  { key: 'location', label: 'islamicart.sheet.location', value: locationWithCountry },
  // The holder text, then the partner it refers to (`PartnerPanel`'s summary),
  // rendered by ItemDetail.vue's `holder` slot (decision D3).
  { key: 'holder', label: 'islamicart.sheet.holdingMuseum', value: plain('holder'), render: 'custom' },
  { key: 'originalOwner', label: 'islamicart.sheet.originalOwner', value: plain('initial_owner') },
  { key: 'currentOwner', label: 'islamicart.sheet.currentOwner', value: plain('owner') },
  { key: 'date', label: 'islamicart.sheet.dateOfObject', value: plain('dates') },
  // The artist line as the page's language writes it, or none: legacy printed
  // each language's own line, and `artist_names` come from one language's.
  { key: 'artists', label: 'islamicart.sheet.artists', value: 'artist' },
  { key: 'scribe', label: 'islamicart.sheet.scribe', value: 'scriber' },
  { key: 'inventoryNumber', label: 'islamicart.sheet.inventoryNumber', value: (c) => removeEndingPoint(String(c.record.owner_reference ?? '')) },
  // Legacy's Material(s) / Technique(s) line is the record's own materials
  // text, which the package splits at its semicolons (inventory-app#2233,
  // C6). The type of object was never on this sheet.
  { key: 'materials', label: 'islamicart.sheet.materials', value: (c) => c.text.materials, join: '; ' },
  { key: 'dimensions', label: 'islamicart.sheet.dimensions', value: plain('dimensions') },
  { key: 'dynasty', label: 'islamicart.sheet.periodDynasty', value: periodDynasty },
  { key: 'placeOfProduction', label: 'islamicart.sheet.placeOfProduction', value: plain('place_of_production') },
  { key: 'workshop', label: 'islamicart.sheet.workshop', value: 'workshop' },
  { key: 'provenance', label: 'islamicart.sheet.provenance', value: 'provenance' },
  { key: 'patrons', label: 'islamicart.sheet.patrons', value: 'patrons' },
  { key: 'binding', label: 'islamicart.sheet.binding', value: 'binding_desc' },
]

// The prose under the facts, in legacy's order and under its headings. The
// item's rights line (`notice_b`, the package's `copyright`) closes both.
const copyright = { key: 'copyright', label: 'islamicart.sheet.copyrightInformation', value: 'copyright' }

const monumentSections = [
  { key: 'history', label: 'islamicart.sheet.history', value: 'history' },
  { key: 'description', label: 'islamicart.sheet.description', value: 'description' },
  { key: 'datation', label: 'islamicart.sheet.monumentDatationMethod', value: 'method_for_datation' },
  { key: 'bibliography', label: 'islamicart.sheet.bibliography', value: 'bibliography' },
  copyright,
]

const objectSections = [
  { key: 'description', label: 'islamicart.sheet.description', value: 'description' },
  { key: 'datation', label: 'islamicart.sheet.datationMethod', value: 'method_for_datation' },
  { key: 'obtention', label: 'islamicart.sheet.obtentionMethod', value: 'obtention' },
  { key: 'provenanceMethod', label: 'islamicart.sheet.provenanceMethod', value: 'method_for_provenance' },
  {
    key: 'catalogue',
    label: 'islamicart.sheet.catalogue',
    value: (c) => {
      const link = removeEndingPoint(String(c.text.catalogue_holding_link ?? ''))
      return link ? `[${link}](${link})` : ''
    },
  },
  { key: 'bibliography', label: 'islamicart.sheet.bibliography', value: 'bibliography' },
  copyright,
]

// The credits as legacy printed them: each author type's `db_` word, then the
// citation under its own, then the working number under its.
const credits = [
  { field: 'author', label: 'islamicart.sheet.preparedBy' },
  { field: 'copy_editor', label: 'islamicart.sheet.copyeditedBy' },
  { field: 'translator', label: 'islamicart.sheet.translationBy' },
  { field: 'translation_copy_editor', label: 'islamicart.sheet.translationCopyeditedBy' },
]

const isMonument = (ctx) => ctx.record?.type === 'monument'

// Legacy's citation (modules/database_item.php): the writers' names as their
// English record spells them, the name without its ending period in quotes,
// the phrase legacy's table words for the project in each language (Explore
// Islamic Art Collections has its own), the year, then the page's address in
// italics on a line of its own. Legacy printed the year twice on a monument;
// that slip is not kept.
const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export function legacyCitation(c, { permalink, year }) {
  const english = useDataPackage().tr('items', c.record.id, 'en')
  const writers = removeEndingPoint(renderPlain(String(english.author ?? ''))).trim()
  const name = removeEndingPoint(renderPlain(String(c.text.name ?? c.record.internal_name ?? ''))).trim()
  const phrase = renderInline(
    c.t(c.record.project_id === PROJECTS.explore ? 'islamicart.sheet.citationEpm' : 'islamicart.sheet.citationIsl'),
  )
  const sentence = `${[escapeHtml(writers), `"${escapeHtml(name)}"`].filter(Boolean).join(' ')} ${phrase} ${year}.`
  return permalink ? `${sentence} <br><i>${escapeHtml(permalink)}</i>` : sentence
}

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
  credits,
  // Each credited person apart, their biography over their name where they
  // have one in the sheet's language (legacy's su_tooltip).
  creditPeople: { entity: 'authors' },
  citation: { heading: 'islamicart.sheet.citation', format: legacyCitation },
  workingNumberLabel: 'islamicart.sheet.workingNumber',
  route: 'item',
  // Legacy's gap under the pictures and under the sheet.
  spaced: true,
}
