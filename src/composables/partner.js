import { CATALOGUE_PAGE_SIZE, partnerView, removeEndingPoint } from '@museumwnf/viewer-core'
import { PROJECTS } from '../dataset.config.js'
import { inScope, legacyOrder, resultTile } from './catalogue.js'
import { useData } from './data.js'

// The partner specs: what viewer-layout's `PartnerListView` renders on
// `/partners/results` and the partner profile on `/partner/:id`. The engine —
// country grouping, the main/associated tiers, the associated-under-parent
// nesting (G.1's `level`/`parent_id`), the record language switcher, the
// glossary — is the platform's; what is declared here is only what is this
// website's: the museum/institution and project axes legacy read from two
// separate pages (`pm_partner_list.php`, `pm_partner_list_eiac.php`,
// `dataset.config.js`'s `partnerEntrance`/`PROJECTS`), and the partner's
// view-model with this website's routes.

const { countryLabel, md, mdInline, partnerLabel, partners, tr } = useData()

// Discover Islamic Art's own partner lists (PartnerList.vue), as legacy's
// pm_partner_list.php read them: per country, by the country's name in the
// page's language, the project's partners of one type by name, and under
// them every associated partner of theirs by name, the "Further Associated"
// entries (legacy's base name) last.
const furtherAssociated = (partner) => /^further associated /i.test(tr('partners', partner.id, 'en').name ?? '')
// Legacy's ORDER BY, as MySQL's utf8_general_ci compares: case and accents
// folded, then character by character, so "‘Ajlun" comes after the letters.
const folded = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const legacyCompare = (a, b) => {
  const x = folded(a)
  const y = folded(b)
  return x < y ? -1 : x > y ? 1 : 0
}
export function partnerListGroups(type) {
  const list = partners.value ?? []
  const byName = (a, b) => legacyCompare(partnerLabel(a.id), partnerLabel(b.id))
  const main = list.filter(
    (p) => p.type === type && p.level === 'partner' && (p.project_uuids ?? []).includes(PROJECTS.discover),
  )
  const groups = new Map()
  for (const partner of main) {
    const label = countryLabel(partner.country_id)
    if (!groups.has(label)) groups.set(label, { label, main: [], associated: [] })
    groups.get(label).main.push(partner)
  }
  for (const group of groups.values()) {
    group.main.sort(byName)
    for (const parent of group.main) {
      const own = list.filter((p) => p.parent_id === parent.id)
      group.associated.push(
        ...own.filter((p) => !furtherAssociated(p)).sort(byName),
        ...own.filter(furtherAssociated).sort(byName),
      )
    }
  }
  return [...groups.values()].sort((a, b) => legacyCompare(a.label, b.label))
}

// Explore Islamic Art Collections' list (PartnerListEiac.vue), as legacy's
// pm_partner_list_eiac.php read it, in English only: per country by its
// English name, the main partners of Discover Islamic Art, then those of
// Explore, each followed by its associated partners by city, the "Further
// Associated" entries left out. Legacy joined the English names, so a
// partner without one is not listed. Its main partners came in no stated
// order within a project: they keep the package's.
export function eiacListGroups(type) {
  const list = partners.value ?? []
  const english = (partner) => tr('partners', partner.id, 'en')
  const named = (partner) => Boolean(english(partner).name)
  const inDiscover = (partner) => (partner.project_uuids ?? []).includes(PROJECTS.discover)
  const main = list.filter(
    (p) => p.type === type && p.level === 'partner' && named(p)
      && (inDiscover(p) || (p.project_uuids ?? []).includes(PROJECTS.explore)),
  )
  const entry = (partner, associated) => ({
    partner,
    associated,
    name: removeEndingPoint(english(partner).name ?? ''),
    city: english(partner).city ?? '',
    image: [...(partner.images ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.url ?? '',
  })
  const groups = new Map()
  for (const partner of [...main.filter(inDiscover), ...main.filter((p) => !inDiscover(p))]) {
    const label = countryLabel(partner.country_id, 'en')
    if (!groups.has(label)) groups.set(label, { label, entries: [] })
    const own = list
      .filter((p) => p.parent_id === partner.id && named(p) && !furtherAssociated(p))
      .sort((a, b) => legacyCompare(english(a).city ?? '', english(b).city ?? ''))
    groups.get(label).entries.push(entry(partner, false), ...own.map((p) => entry(p, true)))
  }
  return [...groups.values()].sort((a, b) => legacyCompare(a.label, b.label))
}

// Both `filterType`/`project` come from the entrance's own link
// (PartnersEntrance.vue) and stay on the URL PartnersResults.vue reads, so
// the spec is rebuilt whenever that query changes rather than read once.
// `project` is a project UUID; partners carry it under `project_uuids`
// (`project_ids`, the legacy-key array, is never read here — #1727 phase 4).
export function partnersResultsSpec(filterType, project) {
  return {
    scope: (partner) => partner.type === filterType && (partner.project_uuids ?? []).includes(project),
    // Associated partners nest under their own main partner (G.1's
    // `parent_id`) instead of a flat column, wherever that parent is in the
    // same group; one without a parent in this scope stays flat.
    group: { tier: 'level', order: 'country' },
    nested: true,
    variant: 'accordion',
    count: true,
    label: (countryId, ctx) => (countryId ? countryLabel(countryId) : ctx.t('catalogue.field.other')),
    // Both branches spell their own name in full — a name built from
    // `filterType` would resolve at run time, invisible to the check that
    // every name a page asks for exists.
    associatedLabel:
      filterType === 'museum' ? 'islamicart.partner.associatedMuseums' : 'islamicart.partner.associatedInstitutions',
    empty: filterType === 'museum' ? 'standalone.partner.noMuseums' : 'standalone.partner.noInstitutions',
    route: 'partner',
  }
}

// Where a partner's "View Objects"/"View Monuments" lands: legacy's
// pm_museum_items.php / pm_institution_items.php, the partner's own page of
// tiles.
export function partnerObjectsLink(partner) {
  return { name: 'partner-items', params: { id: partner.id } }
}

// The partner profile's pill to that page (PartnerDetail.vue): a museum's
// objects, an institution's monuments, for a partner that holds any.
export function partnerItemsLink(partner) {
  if (!partner?.item_count) return null
  return {
    label: partner.type === 'institution' ? 'islamicart.pp.viewMonuments' : 'islamicart.pp.viewObjects',
    to: partnerObjectsLink(partner),
  }
}

// The profile's view-model, read as legacy's pm_partner.php printed it: the
// name, the city and the contact lines without their ending period.
const plain = (value) => (value ? removeEndingPoint(String(value)) : value)
export function partnerProfileView(partner, text) {
  const own = text ?? {}
  const view = partnerViewOf(partner, {
    ...own,
    ...Object.fromEntries(['name', 'city', 'address', 'phone', 'fax', 'email'].map((key) => [key, plain(own[key])])),
  })
  view.persons = view.persons.map((person) =>
    Object.fromEntries(Object.entries(person).map(([key, value]) => [key, typeof value === 'string' ? plain(value) : value])),
  )
  return view
}

// Legacy listed no About tab for its "Further Associated Museums" entries,
// by their name in the three languages it checked.
const FURTHER_ASSOCIATED = ['Further Associated Museums', 'Otros museos asociados', 'Autres musées associés']
export const listsAbout = (partner, text) => !FURTHER_ASSOCIATED.includes(String(text?.name ?? '').trim())

// That page's records (PartnerItems.vue), as legacy's two queries read them:
// a museum's objects of both projects, an institution's monuments of every
// project but Baroque Art (the package carries no other); in the
// Permanent Collection's order and tile, twenty a page.
export function partnerItemsSpec(partnerId, type) {
  const kind = type === 'institution' ? 'monument' : 'object'
  return {
    entity: 'items',
    keys: [],
    scope: (item) => item.partner_id === partnerId && item.type === kind && (kind === 'monument' || inScope(item, true)),
    sort: legacyOrder,
    pageSize: CATALOGUE_PAGE_SIZE,
    record: resultTile,
    summary: () => [],
    empty: 'islamicart.pcr.empty',
  }
}

// Legacy's way back from that page follows the list the visitor came from
// (its `link` parameter); a partner only Explore Islamic Art Collections
// holds is reached from that project's list alone.
export const exploreOnly = (partner) =>
  !(partner?.project_uuids ?? []).includes(PROJECTS.discover) && (partner?.project_uuids ?? []).includes(PROJECTS.explore)

// The partner's view-model, which `PartnerPanel` renders on the partner page
// and under an item's holder text: this website's country label, its
// renderers (the glossary-bound ones) and its two routes.
export function partnerViewOf(partner, text) {
  return partnerView(partner, text, {
    countryLabel,
    md,
    mdInline,
    route: (p) => ({ name: 'partner', params: { id: p.id } }),
    objectsRoute: partnerObjectsLink,
  })
}