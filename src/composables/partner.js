import { partnerView } from '@museumwnf/viewer-core'
import { useData } from './data.js'

// The partner specs: what viewer-layout's `PartnerListView` renders on
// `/partners/results` and `RecordView` on `/partner/:id`. The engine —
// country grouping, the main/associated tiers, the associated-under-parent
// nesting (G.1's `level`/`parent_id`), the record language switcher, the
// glossary — is the platform's; what is declared here is only what is this
// website's: the museum/institution and project axes legacy read from two
// separate pages (`pm_partner_list.php`, `pm_partner_list_eiac.php`,
// `dataset.config.js`'s `partnerEntrance`/`PROJECTS`), and the partner's
// view-model with this website's routes.

const { countryLabel, md, mdInline } = useData()

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

// The partner page (PartnerDetail.vue): `RecordView` carries the record's
// language, its load and the not-found case; the page's body is viewer-
// layout's `PartnerPanel` (inventory-app#2035), rendering the partner's
// view-model — the About/Contact/Logo tabs, the homepage link, the pictures
// and the map. So the sheet itself declares nothing: no field, no section,
// no media gallery of its own (the pictures are the panel's), no citation
// (legacy printed none on a partner profile), and no `related` — the held
// items are a reverse reference (`item.partner_id`), which PartnerDetail.vue's
// `related` slot lists itself.
export const partnerSheetSpec = {
  entity: 'partners',
  fields: [],
  shortDescription: false,
  media: () => [],
  citation: false,
  related: false,
}

// Where a partner's "View Objects"/"View Monuments" lands: the Permanent
// Collection, filtered on the partner.
export function partnerObjectsLink(partner) {
  return { name: 'permanent-collection-results', query: { partner: partner.id } }
}

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