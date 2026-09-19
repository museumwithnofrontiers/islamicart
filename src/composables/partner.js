import { useInventoryData } from './useInventoryData.js'

// The partner specs: what viewer-layout's `PartnerListView` renders on
// `/partners/results` and `RecordView` on `/partner/:id`. The engine —
// country grouping, the main/associated tiers, the associated-under-parent
// nesting (G.1's `level`/`parent_id`), the record language switcher, the
// glossary — is the platform's; what is declared here is only what is this
// website's: the museum/institution and project axes legacy read from two
// separate pages (`pm_partner_list.php`, `pm_partner_list_eiac.php`,
// `dataset.config.js`'s `partnerEntrance`/`PROJECTS`), and the partner
// sheet's field/section shape.

const { countryLabel } = useInventoryData()

// Both `filterType`/`project` come from the entrance's own link
// (PartnersEntrance.vue) and stay on the URL PartnersResults.vue reads, so
// the spec is rebuilt whenever that query changes rather than read once.
// `project` is a project UUID; partners carry it under `project_uuids`
// (`project_ids`, the legacy-key array, is never read here — #1727 phase 4).
export function partnersResults(filterType, project) {
  return {
    scope: (partner) => partner.type === filterType && (partner.project_uuids ?? []).includes(project),
    // Associated partners nest under their own main partner (G.1's
    // `parent_id`) instead of a flat column, wherever that parent is in the
    // same group; one without a parent in this scope stays flat.
    group: { tier: 'level', order: 'country' },
    nested: true,
    variant: 'accordion',
    count: true,
    label: (countryId, ctx) => (countryId ? countryLabel(countryId) : ctx.t('islamicart.results.otherCountry')),
    // Both branches spell their own name in full — a name built from
    // `filterType` would resolve at run time, invisible to the check that
    // every name a page asks for exists.
    associatedLabel:
      filterType === 'museum' ? 'islamicart.partner.associatedMuseums' : 'islamicart.partner.associatedInstitutions',
    empty: filterType === 'museum' ? 'islamicart.partner.noMuseums' : 'islamicart.partner.noInstitutions',
    route: 'partner',
  }
}

// The partner sheet: description as prose, everything else — contact,
// logo, the map, the held items — this website's own, filled through
// RecordView's slots (PartnerDetail.vue), the same split the item sheet
// (composables/sheet.js) follows.
export const partnerSheet = {
  entity: 'partners',
  sections: [{ key: 'description', label: 'partner.info.about', value: 'description' }],
  shortDescription: false,
  // A partner is never cited the way an item sheet is; legacy printed no
  // such line on a partner profile.
  citation: false,
  // Partner images carry `alt_text`, not the per-language `captions` a
  // catalogue item's images do, so the default media mapping does not fit.
  media: (record, ctx) => {
    const name = ctx.text.name ?? record.internal_name ?? record.id
    return (record.images ?? []).map((img) => ({
      url: img.url,
      alt: img.alt_text ?? name,
      caption: img.alt_text ?? '',
      photographer: img.photographer ?? '',
      copyright: img.copyright ?? '',
    }))
  },
  // The held items are a reverse reference (`item.partner_id`), not the
  // forward `related_items` RecordView's own related-records engine reads;
  // PartnerDetail.vue's `related` slot builds that list itself.
  related: false,
}
