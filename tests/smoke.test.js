import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages, projectLabel, useDataPackage } from '@museumwnf/viewer-core'
import { checkOfferedLanguages, checkRoutes, checkSectionMeta, checkTextsRendered, mountSite as mountOn } from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import config, { PROJECTS } from '../src/dataset.config.js'
import { useData } from '../src/composables/data.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

// The kit's own `mountSite`, bound to this website's config and messages —
// every call site below reads exactly as it did when this file built the
// same mount itself.
const mountSite = (hash) => mountOn(config, messages, hash)

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The home route renders viewer-layout's HomeView from `config.home`, in
    // place of viewer-core's generic home view: the welcome and the six
    // sections, the welcome in the site's panel.
    expect(host.querySelector('.vc-home')).toBeNull()
    await vi.waitFor(() => expect(host.querySelector('.mwnf-home__welcome')).not.toBeNull(), { timeout: 15000 })
    expect(host.querySelector('.mwnf-home__welcome').classList.contains('mwnf-panel')).toBe(true)
    expect(host.querySelectorAll('.mwnf-cards__title')).toHaveLength(6)

    app.unmount()
    // Longer than vitest's default 5s. This mounts the whole website against
    // the real data package, and this one is the largest of the seven; being
    // the first test, it also pays for transforming the composed views the
    // home page is. It took up to 22s on a cold run. A blocking check that
    // fails at random teaches people to re-run it rather than read it, so it
    // gets the minute the other page tests have.
  }, 60000)

  // The Permanent Collection list runs on the platform's composed results
  // view (metanull/viewer-core#50, metanull/viewer-layout#33): the rows, the
  // filter panel and the Explore checkbox come from the catalogue spec, and
  // what only this website has — the heading suffix — fills the view's slot.
  it('renders the Permanent Collection on the composed results view', async () => {
    const { app, host } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-catalogue')).not.toBeNull()
    expect(host.querySelector('.mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.mwnf-facet--checkbox input[type="checkbox"]')).not.toBeNull()
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Permanent Collection')
    // Legacy's count, in its two halves: objects and monuments.
    expect(host.querySelectorAll('.mwnf-summary__count').length).toBe(2)
    app.unmount()
  }, 60000)

  // The Explore checkbox writes the same URL key legacy's opt-in checkbox
  // did (`epm`), so the entrance's link keeps working: checking it must
  // widen the results beyond the always-searched Discover Islamic Art
  // project. The row count alone would not show this — a page holds twenty
  // rows regardless — so this reads the summary's total instead.
  function summaryTotal(host) {
    return [...host.querySelectorAll('.mwnf-summary__count')]
      .reduce((sum, el) => sum + Number(el.textContent), 0)
  }

  it('widens the Permanent Collection when Explore is set in the URL', async () => {
    const { app: withoutEpm, host: hostWithoutEpm } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(hostWithoutEpm.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const totalWithoutEpm = summaryTotal(hostWithoutEpm)
    withoutEpm.unmount()

    const { app: withEpm, host: hostWithEpm } = await mountSite('#/permanent-collection/results?epm=1')
    await vi.waitFor(() => expect(hostWithEpm.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const totalWithEpm = summaryTotal(hostWithEpm)
    withEpm.unmount()

    expect(totalWithEpm).not.toBe(totalWithoutEpm)
  }, 60000)

  // The Timeline entrance and results move onto viewer-layout's composed
  // `TimelineResultsView` (metanull/islamicart#47): the country/period axis,
  // the rows and the pagination come from the spec in
  // composables/timeline.js, and what only this website has — the per-event
  // "View items from this period" action into the Permanent Collection —
  // fills the row through `spec.event`. Germany ('deu') is picked because
  // the data package carries both timeline events and items for it, so the
  // scoped results and the action's own target are both non-empty.
  it('renders the Timeline results scoped to a country, with the per-event action into the Permanent Collection', async () => {
    const { app, host } = await mountSite('#/timeline/results?country=deu')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-timeline__row')).not.toBeNull(), { timeout: 20000 })

    expect(host.querySelector('.mwnf-heading').textContent).toContain('Timeline')
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Germany')

    // Every row's caption is the filtered country's own name, not an id.
    const captions = [...host.querySelectorAll('.mwnf-timeline__caption')].map((el) => el.textContent.trim())
    expect(captions.length).toBeGreaterThan(0)
    expect(captions.every((caption) => caption === 'Germany')).toBe(true)

    const action = host.querySelector('.mwnf-timeline__action')
    expect(action).not.toBeNull()
    expect(action.textContent).toContain('View items from this period')
    expect(action.getAttribute('href')).toContain('permanent-collection/results')
    expect(action.getAttribute('href')).toContain('country=deu')

    // The first row's date and description text match the fixture event.
    const { default: timelineEventsData } = await import('@museumwnf/islamicart-data/timeline_events.json', { assert: { type: 'json' } })
    const { default: timelineEventsTrans } = await import('@museumwnf/islamicart-data/translations/timeline_events.en.json', { assert: { type: 'json' } })
    const firstDeuEvent = timelineEventsData.find((evt) => evt.country_id === 'deu')
    if (firstDeuEvent && timelineEventsTrans[firstDeuEvent.id]) {
      const trans = timelineEventsTrans[firstDeuEvent.id]
      const firstRow = host.querySelector('.mwnf-timeline__row')
      const rowDate = firstRow.querySelector('.mwnf-timeline__date')?.textContent.trim() ?? ''
      const rowDescription = firstRow.querySelector('.mwnf-timeline__description')?.textContent.trim() ?? ''

      // Verify date text matches the fixture.
      const expectedDate = trans.date_to_description && trans.date_to_description !== trans.date_from_description
        ? `${trans.date_from_description} – ${trans.date_to_description}`
        : trans.date_from_description
      expect(rowDate).toBe(expectedDate)

      // Verify description contains the first six words of the fixture text.
      const firstSixWords = trans.description.split(' ').slice(0, 6).join(' ')
      expect(rowDescription).toContain(firstSixWords)
    }

    app.unmount()
  }, 30000)

  // Decision D1: the timeline gallery of objects legacy served from
  // `hcr_gallery.php`, regained as `/timeline/gallery` — a `CatalogueResultsView`
  // spec scoped to the timeline's own country and period. "See gallery" is
  // offered once objects exist for it (Germany does) and withheld once they
  // do not (France carries timeline events but no items in this package).
  it('offers "See gallery" once the period has objects, and the gallery lists that country\'s items', async () => {
    const withObjects = await mountSite('#/timeline/results?country=deu')
    await vi.waitFor(() => expect(withObjects.host.querySelector('.mwnf-timeline__gallery')).not.toBeNull(), { timeout: 20000 })
    expect(withObjects.host.querySelector('.mwnf-timeline__gallery').textContent).toContain('See Gallery')
    withObjects.app.unmount()

    const withoutObjects = await mountSite('#/timeline/results?country=fra')
    await vi.waitFor(() => expect(withoutObjects.host.querySelector('.mwnf-timeline__row')).not.toBeNull(), { timeout: 20000 })
    expect(withoutObjects.host.querySelector('.mwnf-timeline__gallery')).toBeNull()
    withoutObjects.app.unmount()

    const { app, host } = await mountSite('#/timeline/gallery?country=deu')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Timeline Gallery')
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Germany')
    app.unmount()
  }, 60000)

  // The search entrance moved onto viewer-layout's composed `SearchFormView`
  // (metanull/islamicart#49, `mode: 'rows'`): the three keyword rows, the
  // century date selects and the search-language select come from the spec
  // in composables/search.js; the Explore checkbox is the site's own
  // `extras` entry.
  it('renders the Database entrance on the composed search form', async () => {
    const { app, host } = await mountSite('#/database')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-search-form__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelectorAll('.mwnf-search-form__row').length).toBe(3)
    expect(host.textContent).toContain('Keyword 1')
    expect(host.textContent).toContain('Search language')
    expect(host.querySelector('.mwnf-facet--checkbox input[type="checkbox"]')).not.toBeNull()
    app.unmount()
  }, 20000)

  // The database results moved onto the composed `CatalogueResultsView`
  // (metanull/islamicart#49): the field grammar, ranking and expansions run
  // through `useKeywordIndex` in composables/search.js. Decision D3's
  // country expansion (legacy's `getKeywordCountry`) is exercised directly:
  // this Jordanian cross's own name/description/tags never say "Jordan" (the
  // fixture was picked for that), so it is found only because the keyword
  // field's haystack carries the raw country id and the expansion turns the
  // typed country name into it.
  it('finds an item through the country-name expansion, not a literal text match', async () => {
    const [items] = await loadEntities(['items'])
    const cross = items.find((i) => i.id === '55ec1f26-ba55-52bc-a1b6-556c48ff41e4')
    expect(cross.country_id).toBe('jor')

    const { app, host } = await mountSite('#/database/results?q=Jordan&field=keyword')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('A bronze Greek cross')
    // The recap line spells out what was searched — never just a count.
    expect(host.textContent).toContain('Keyword(s): "Jordan"')
    app.unmount()
  }, 30000)

  // The Explore checkbox widens the database search the same way it widens
  // the Permanent Collection (composables/catalogue.js's `inScope`, shared
  // by both specs).
  it('widens the database search when Explore is set in the URL', async () => {
    const { app: withoutEpm, host: hostWithoutEpm } = await mountSite('#/database/results')
    await vi.waitFor(() => expect(hostWithoutEpm.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const totalWithoutEpm = summaryTotal(hostWithoutEpm)
    withoutEpm.unmount()

    const { app: withEpm, host: hostWithEpm } = await mountSite('#/database/results?epm=1')
    await vi.waitFor(() => expect(hostWithEpm.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const totalWithEpm = summaryTotal(hostWithEpm)
    withEpm.unmount()

    expect(totalWithEpm).not.toBe(totalWithoutEpm)
  }, 60000)

  // The refine row (composables/search.js's `q4`/`field4`/`op4`) narrows an
  // existing search further, the same way legacy's "Refine" panel added a
  // fourth keyword to the three already submitted.
  it('narrows a search with the refine row', async () => {
    const { app: broad, host: broadHost } = await mountSite('#/database/results?q=Jordan&field=keyword')
    await vi.waitFor(() => expect(broadHost.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const broadTotal = summaryTotal(broadHost)
    broad.unmount()

    const { app, host } = await mountSite('#/database/results?q=Jordan&field=keyword&q4=cross&field4=keyword&op4=AND')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(summaryTotal(host)).toBeLessThan(broadTotal)
    expect(host.textContent).toContain('A bronze Greek cross')
    app.unmount()
  }, 30000)

  // The Permanent Collection entrance moved onto the composed
  // `SearchFormView` (`mode: 'radio'`); its facet options are the values the
  // records actually carry (composables/catalogue.js's `FACETS`), the same
  // derivation the results page's own filter panel uses.
  it('renders the Permanent Collection entrance on the composed radio search form', async () => {
    const { app, host } = await mountSite('#/permanent-collection')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-search-form__radio-row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelectorAll('.mwnf-search-form__radio-row').length).toBe(5)
    expect(host.textContent).toContain('Holding institution')
    app.unmount()
  }, 20000)
  // The holding museum (decision D3, inventory-app#2035): the holder text,
  // then the partner as viewer-layout's `PartnerPanel` summary — "About
  // {name}, {city}, {country}" — linking to the partner's page; none for an
  // associated museum, as legacy's `associated_museums` check did.
  it("shows the holder text and the holding museum's summary on an object sheet", async () => {
    const [items, partners] = await loadEntities(['items', 'partners'])
    const pkg = useDataPackage()
    const itemTexts = await pkg.loadTranslations('items', 'en')
    const partnerTexts = await pkg.loadTranslations('partners', 'en')
    const byId = new Map(partners.map((p) => [p.id, p]))
    const object = items.find((i) => i.type === 'object' && itemTexts[i.id]?.holder
      && byId.get(i.partner_id) && byId.get(i.partner_id).level !== 'associated_partner' && partnerTexts[i.partner_id]?.name)
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(object.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-partner-panel--summary')).not.toBeNull(), { timeout: 20000 })
    const summary = host.querySelector('.mwnf-partner-panel--summary')
    expect(summary.textContent).toContain(`About ${partnerTexts[object.partner_id].name}`)
    expect(summary.querySelector('a').getAttribute('href')).toBe(`#/partner/${object.partner_id}`)
    // The holder text itself stays, before the summary.
    expect(host.textContent).toContain(itemTexts[object.id].holder.trim().slice(0, 20))
    app.unmount()

    const associated = items.find((i) => i.type === 'object' && itemTexts[i.id]?.holder
      && byId.get(i.partner_id)?.level === 'associated_partner')
    if (associated) {
      const { app: other, host: otherHost } = await mountSite(`#/item/${encodeURIComponent(associated.id)}`)
      await vi.waitFor(() => expect(otherHost.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
      expect(otherHost.querySelector('.mwnf-partner-panel--summary')).toBeNull()
      other.unmount()
    }
  }, 60000)

  // The item sheet runs on the platform's composed record view
  // (metanull/viewer-core#50): the rows come from the sheet spec, and what
  // only this website has — the dynasty popout, the Artistic Introduction
  // links, the type badge — fills the view's slots. A monument and an object
  // read different field orders (composables/sheet.js), so both are mounted.
  it('renders an object sheet on the composed record view', async () => {
    const [items] = await loadEntities(['items'])
    const object = items.find((i) => i.type === 'object')
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(object.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe('object')
    expect(host.querySelector('.detail-title').textContent.trim()).not.toBe('')

    // The citation's source credit (islamicart#58): `sourceUrl()` only
    // produces an address once the website declares `site.origin`
    // (dataset.config.js), and `itemSheet`'s citation carries no permalink
    // override, so the record's own hash address is the default.
    const credit = host.querySelector('.mwnf-source-credit')
    expect(credit).not.toBeNull()
    const creditLink = credit.querySelector('a')
    // The route's own query (`?lang=en`, set once the language resolves)
    // rides along after the path, so this checks the origin and the item's
    // own route rather than the address as a whole.
    expect(creditLink.textContent.startsWith(config.site.origin)).toBe(true)
    expect(creditLink.textContent).toContain(`#/item/${encodeURIComponent(object.id)}`)

    app.unmount()
  }, 60000)

  // The blocks after the sheet are viewer-layout's item-page blocks. An item
  // with a video and THG galleries shows both: the video as a link out, the
  // galleries by name — the package carries no address for them, and a
  // same-page anchor would lead the hash router to its not-found page.
  it('shows the related video and the THG galleries through the shared item-page blocks', async () => {
    const [items] = await loadEntities(['items'])
    const item = items.find((i) => i.media?.some((m) => m.language === 'en') && i.thg_galleries?.length)
    expect(item).toBeTruthy()
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(item.id)}?lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-related-media')).not.toBeNull(), { timeout: 20000 })

    const video = host.querySelector('.mwnf-related-media__link')
    expect(video.getAttribute('href')).toBe(item.media.find((m) => m.language === 'en').url)
    expect(video.getAttribute('target')).toBe('_blank')

    const galleries = Array.from(host.querySelectorAll('.mwnf-on-display')).find((block) =>
      item.thg_galleries.every((g) => block.textContent.includes(g.name)))
    expect(galleries).toBeTruthy()
    expect(galleries.querySelector('a[href*="ThematicGallery"]')).toBeNull()

    app.unmount()
  }, 60000)

  // #1727 cleanup: `itemSheet` (composables/sheet.js) no longer names a
  // project for the citation, so `RecordView` resolves it from the record's
  // own `project_id` against the data package's `manifest.projects` — this
  // reads the name straight off the installed package rather than asserting
  // a string this test would otherwise have to hardcode, and covers both
  // projects the package carries (a Discover item and an Explore item),
  // since the two used to differ: Explore items rendered the hard-coded
  // "ISL" name through the deprecated fallback before this cleanup.
  it('cites the record\'s own project, read from the manifest, for both Discover and Explore items', async () => {
    const [items] = await loadEntities(['items'])
    const { manifest } = useDataPackage()

    const discoverItem = items.find((i) => i.project_id === PROJECTS.discover)
    const exploreItem = items.find((i) => i.project_id === PROJECTS.explore)
    expect(discoverItem).toBeTruthy()
    expect(exploreItem).toBeTruthy()

    for (const [item, projectId] of [[discoverItem, PROJECTS.discover], [exploreItem, PROJECTS.explore]]) {
      const { app, host } = await mountSite(`#/item/${encodeURIComponent(item.id)}`)
      await vi.waitFor(() => expect(host.querySelector('.mwnf-credits__citation')).not.toBeNull(), { timeout: 20000 })
      const expectedName = projectLabel(manifest, projectId, 'en')
      expect(expectedName).toBeTruthy()
      expect(host.querySelector('.mwnf-credits__citation').textContent).toContain(expectedName)
      app.unmount()
    }
  }, 60000)

  // Decision D5: the standalone dynasties list/sheet legacy never had are
  // gone; what legacy did have — dynasty.php's popup off an item sheet — is
  // viewer-layout's `DynastyPopout`, reached through the item sheet's
  // `after-sheet` slot (ItemDetail.vue).
  it('shows the dynasty popout on a record that carries one', async () => {
    const [items] = await loadEntities(['items'])
    const item = items.find((i) => i.id === '8750b2ef-ed27-560f-a5b8-9740d8ab180c')
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(item.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-dynasty')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('Dynasties')
    expect(host.textContent).toContain('Mughal')
    app.unmount()
  }, 60000)

  it('renders a monument sheet with a different field order than an object', async () => {
    const [items] = await loadEntities(['items'])
    const monument = items.find((i) => i.type === 'monument')
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(monument.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe('monument')
    expect(host.querySelector('.detail-title').textContent.trim()).not.toBe('')
    const labels = [...host.querySelectorAll('.mwnf-sheet__label')].map((el) => el.textContent.trim())
    // A monument's date reads "Date of monument", an object's "Date of
    // object" — the two specs in composables/sheet.js name the same field
    // differently, and neither reads a holding museum.
    expect(labels).toContain('Date of monument')
    expect(labels).not.toContain('Date of object')
    expect(labels).not.toContain('Holding museum')
    app.unmount()
  }, 60000)

  // The partner list moved onto viewer-layout's composed `PartnerListView`
  // (metanull/islamicart#48): the country grouping and the associated tier
  // come from the spec in composables/partner.js. Jordan is picked because
  // the data package nests an associated museum ('Ajlun Castle Museum)
  // under a main one (Jordan Archaeological Museum) there (G.1's
  // `level`/`parent_id`), so the nesting is visible rather than merely
  // configured.
  it('renders the partner list grouped by country, nesting an associated partner under its own parent', async () => {
    const { app, host } = await mountSite(`#/partners/results?type=museum&project=${PROJECTS.discover}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-partner-list__row')).not.toBeNull(), { timeout: 20000 })

    expect(host.querySelector('.mwnf-heading').textContent).toContain('Partner Museums')

    const jordanGroup = [...host.querySelectorAll('.mwnf-partner-list__group')].find((el) =>
      el.querySelector('.mwnf-partner-list__group-title')?.textContent.includes('Jordan')
    )
    expect(jordanGroup).not.toBeUndefined()
    expect(jordanGroup.textContent).toContain('Jordan Archaeological Museum')

    const nested = jordanGroup.querySelector('.mwnf-partner-list__children')
    expect(nested).not.toBeNull()
    expect(nested.textContent).toContain('Ajlun Castle Museum')

    app.unmount()
  }, 60000)

  // #1727 phase 4: the project heading reads the data package's own manifest
  // (`useProjects().label()`, dataset.config.js's `PROJECTS`), and the
  // partner scope reads `project_uuids` — never the legacy `project_ids`
  // key array. The Explore project (unlike Discover) offers no
  // institutions panel, so this exercises the second, narrower entry of
  // `partnerEntrance`.
  it('renders the Explore Islamic Art Collections partner list by its manifest name and project UUID scope', async () => {
    const { app, host } = await mountSite(`#/partners/results?type=museum&project=${PROJECTS.explore}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-partner-list__row')).not.toBeNull(), { timeout: 20000 })

    // The manifest's own name for this project (manifest.json's
    // `projects['928f5e0d-...'].name.en`), not a site-authored text.
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Explore Islamic Art Collections')
    expect(host.textContent).toContain('Aga Khan Museum')

    app.unmount()
  }, 60000)

  // #1727 phase 4: the entrance's two panels route on `dataset.config.js`'s
  // `PROJECTS` (project UUIDs) rather than a legacy key — Discover offers
  // museums and institutions, Explore (legacy never had an institutions page
  // for it) offers only museums.
  it('renders the partner entrance panels and buttons, routed by project UUID', async () => {
    const { app, host } = await mountSite('#/partners')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-panel')).not.toBeNull(), { timeout: 20000 })

    const panels = host.querySelectorAll('.mwnf-panel')
    expect(panels.length).toBe(2)
    expect(panels[0].textContent).toContain('Browse Museums')
    expect(panels[0].textContent).toContain('Browse Institutions')
    expect(panels[1].textContent).toContain('Browse Museums')
    expect(panels[1].textContent).not.toContain('Browse Institutions')

    const links = [...panels[1].querySelectorAll('button')]
    expect(links.length).toBe(1)

    app.unmount()
  }, 30000)

  // The partner profile is the composed `RecordView` with viewer-layout's
  // `PartnerPanel` as its body (inventory-app#2035): the About/Contact/Logo
  // tabs, the homepage link, the pictures and the map are the panel's; the
  // type badge, the "View Objects" action and the held items are this
  // website's. Ajlun Castle Museum is picked because the package carries an
  // image, a logo, coordinates, contact details and two held items for it,
  // exercising every part at once.
  it('renders a partner profile with its contact details, logo, map and held items', async () => {
    const [partners] = await loadEntities(['partners'])
    const museum = partners.find((p) => p.id === 'c9284900-9055-5081-9abe-863fad506cdc')
    const { app, host } = await mountSite(`#/partner/${encodeURIComponent(museum.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-partner-panel--full')).not.toBeNull(), { timeout: 20000 })

    expect(host.querySelector('h1.mwnf-partner-panel__name').textContent).toContain('Ajlun Castle Museum')
    // The badge is the entry name `partner.info.typeMuseum`/`typeInstitution`
    // resolves to, not the record's own `type` value.
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe('Museum')

    // The action's own count is the package's `item_count`, never a scan of
    // every item in it.
    const viewItems = host.querySelector('.mwnf-partner-panel__actions a')
    expect(viewItems.textContent).toContain(`(${museum.item_count})`)

    const tabs = [...host.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent)
    expect(tabs).toEqual(['About', 'Contact', 'Logo'])
    expect(host.querySelector('.mwnf-partner-panel__logos img')).not.toBeNull()
    // A museum is mapped; the map's heading is the map's own, shown once.
    expect(host.querySelector('.mwnf-partner-map')).not.toBeNull()
    expect(host.querySelectorAll('.mwnf-partner-map__title').length).toBe(1)

    expect(host.textContent).toContain('Related items')
    expect(host.querySelectorAll('.mwnf-list__row').length).toBe(museum.item_count)

    app.unmount()
  }, 60000)

  // The Exhibitions entrance, splash, introduction and theme pages moved
  // onto viewer-layout's composed views (metanull/islamicart#45) over
  // `useCollectionTree`: `SectionCards` for the entrance and the splash's
  // theme list, `EssayView` for the introduction (an `about` page) and a
  // theme's pages (the narrative, the tab strip, the picture panel, and
  // previous/next walking the whole exhibition — decision D2).
  function findExhibitionThemeWithPages() {
    // Not every theme has more than one page; the tab strip (asserted
    // below) only renders past one, so this hunts for one that does rather
    // than assuming the first exhibition's first theme is that one.
    for (const exhibition of collectionsFixture.filter((c) => c.parent_id === exhibitionsRoot.id)) {
      for (const theme of collectionsFixture.filter((c) => c.parent_id === exhibition.id)) {
        const pages = collectionsFixture.filter((c) => c.parent_id === theme.id)
        if (pages.length > 1) return { exhibition, theme }
      }
    }
    return null
  }

  let collectionsFixture
  let exhibitionsRoot

  it('renders the Exhibitions entrance on SectionCards', async () => {
    ;[collectionsFixture] = await loadEntities(['collections'])
    exhibitionsRoot = collectionsFixture.find((c) => c.purpose === 'exhibitions-root')
    expect(exhibitionsRoot).toBeTruthy()

    const { app, host } = await mountSite('#/exhibitions')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Exhibitions')
    app.unmount()
  }, 30000)

  it('renders an exhibition theme on the composed essay view, with its panel and navigation (previous/next, no tab strip)', async () => {
    const { exhibition, theme } = findExhibitionThemeWithPages()
    const { app, host } = await mountSite(`#/exhibitions/${exhibition.id}/theme/${theme.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__tabs')).toBeNull()
    expect(host.querySelector('.mwnf-essay__nav-link')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay-nav, .mwnf-essay__nav')).not.toBeNull()

    // The source credit (islamicart#58): `exhibitionThemeSpec` overrides
    // neither `EssayView`'s `after` slot nor its default `SourceCredit`, so
    // a theme page carries the same citation an item sheet does.
    expect(host.querySelector('.mwnf-source-credit')).not.toBeNull()

    // `panel.variants` (metanull/viewer-layout#49, islamicart#57): the panel
    // opens on the first item's own image with its name as the panel's
    // title; where that item carries curated "detail" close-ups
    // (`entry.details`), a second thumbnail is offered and swaps the whole
    // caption — title, justification and fields together, not just the
    // picture — when picked.
    const panelName = host.querySelector('.mwnf-essay__panel-name')
    expect(panelName).not.toBeNull()
    expect(panelName.textContent.trim()).not.toBe('')

    const activePage = collectionsFixture.find((c) => c.parent_id === theme.id)
    const firstItemEntry = activePage?.items?.[0]
    if ((firstItemEntry?.details ?? []).length > 0) {
      const variants = host.querySelectorAll('.mwnf-essay__variant')
      expect(variants.length).toBeGreaterThan(1)
      const initialName = panelName.textContent
      variants[1].click()
      await vi.waitFor(() => expect(host.querySelector('.mwnf-essay__panel-name').textContent).not.toBe(initialName))
    }

    // The panel's link opens the selected item's own sheet, not a list of
    // every item in the theme (metanull/islamicart#63) — it must read the
    // dictionary's dedicated entry, not `EssayView`'s "See all …" default.
    const panelLink = host.querySelector('.mwnf-essay__panel-link')
    expect(panelLink).not.toBeNull()
    expect(panelLink.textContent).toContain(sharedTexts.en['exhibition.theme.seeItemEntry'])

    // Every page of a theme is reachable by next/previous (metanull/islamicart#63):
    // `findExhibitionThemeWithPages` picked a theme with more than one page, so its
    // first page (`?tab` absent) must offer a "next" link into the second (`tab=1`).
    const nextLink = host.querySelector('.mwnf-essay__nav-link--next')
    expect(nextLink).not.toBeNull()
    expect(nextLink.getAttribute('href')).toContain('tab=1')

    // viewer-core 1.12.1 exposes tree.entity, so EssayView reads the theme's
    // translated title from the collections entity, not the internal_name.
    // The view reads these texts through the tree's own entity, and a wrong
    // entity renders internal names silently.
    const { default: collectionsTranslations } = await import('@museumwnf/islamicart-data/translations/collections.en.json', { assert: { type: 'json' } })
    const themeTranslation = collectionsTranslations[theme.id]
    const essayTitle = host.querySelector('.mwnf-essay__title')
    expect(essayTitle?.textContent.trim()).toBe(themeTranslation?.title ?? theme.internal_name)
    expect(essayTitle?.textContent.trim()).not.toBe(theme.internal_name)
    const essayBody = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
    if (themeTranslation?.description) {
      expect(essayBody?.textContent.trim().length).toBeGreaterThan(0)
    }

    app.unmount()
  }, 30000)

  // The regression this guards against (metanull/islamicart#63): the old
  // `tree.parents(node.id).length !== 2` test never matched a real page (its
  // ancestry runs past this tree's own root, to the exhibitions marker and
  // the project collection above it), so `nextPage`/`previousPage` skipped
  // every candidate and a theme's first page showed no "Next" at all.
  it('reaches the second page of an exhibition theme by following "next"', async () => {
    const { exhibition, theme } = findExhibitionThemeWithPages()
    const { app, host } = await mountSite(`#/exhibitions/${exhibition.id}/theme/${theme.id}?tab=1`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()

    const pages = collectionsFixture.filter((c) => c.parent_id === theme.id)
    if (pages.length > 2) {
      const nextLink = host.querySelector('.mwnf-essay__nav-link--next')
      expect(nextLink).not.toBeNull()
      expect(nextLink.getAttribute('href')).toContain('tab=2')
    }

    app.unmount()
  }, 30000)

  it('renders an exhibition introduction as an about essay', async () => {
    const withIntro = collectionsFixture.find((c) => c.parent_id === exhibitionsRoot.id && (c.items?.length ?? 0) > 0)
    expect(withIntro).toBeTruthy()

    const { app, host } = await mountSite(`#/exhibitions/${withIntro.id}/introduction`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay--about')).not.toBeNull()
    // The page fills EssayView's `after` slot with its way back, and draws the
    // source credit that slot would otherwise have carried.
    expect(host.querySelector('.mwnf-source-credit')).not.toBeNull()
    const back = host.querySelector('.mwnf-back-bar--link')
    expect(back.getAttribute('href')).toBe(`#/exhibitions/${withIntro.id}`)
    app.unmount()
  }, 30000)

  // The Artistic Introduction entrance and theme pages moved onto
  // viewer-layout's composed views (islamicart#46), the same way Exhibitions
  // did: `TextPageView` (its `body(ctx)`, metanull/viewer-layout#49) for the
  // entrance's own text plus `SectionCards` for the theme list, `EssayView`
  // for a theme's pages — `tabs: true`, `navigation: 'siblings'` (legacy
  // never walked from one theme into the next here, unlike Exhibitions).
  function findArtIntroThemeWithPages() {
    for (const theme of collectionsFixture.filter((c) => c.parent_id === artIntroRootFixture.id)) {
      const pages = collectionsFixture.filter((c) => c.parent_id === theme.id)
      if (pages.length > 1) return theme
    }
    return null
  }

  let artIntroRootFixture

  it('renders the Artistic Introduction entrance on TextPageView and SectionCards', async () => {
    const marker = collectionsFixture.find((c) => c.purpose === 'artistic-introduction-root')
    expect(marker).toBeTruthy()
    artIntroRootFixture = collectionsFixture.find((c) => c.parent_id === marker.id)
    expect(artIntroRootFixture).toBeTruthy()

    const { app, host } = await mountSite('#/artistic-introduction')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-text-page')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Artistic Introduction')
    expect(host.querySelector('.mwnf-cards')).not.toBeNull()
    app.unmount()
  }, 30000)

  it('renders an Artistic Introduction theme on the composed essay view, with its tab strip and panel', async () => {
    const theme = findArtIntroThemeWithPages()
    expect(theme).toBeTruthy()

    const { app, host } = await mountSite(`#/artistic-introduction/${theme.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__tabs')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()

    const panelName = host.querySelector('.mwnf-essay__panel-name')
    expect(panelName).not.toBeNull()
    expect(panelName.textContent.trim()).not.toBe('')

    // viewer-core 1.12.1 exposes tree.entity, so EssayView reads the theme's
    // translated title from the collections entity, not the internal_name.
    // The view reads these texts through the tree's own entity, and a wrong
    // entity renders internal names silently.
    const { default: collectionsTranslations } = await import('@museumwnf/islamicart-data/translations/collections.en.json', { assert: { type: 'json' } })
    const themeTranslation = collectionsTranslations[theme.id]
    const essayTitle = host.querySelector('.mwnf-essay__title')
    expect(essayTitle?.textContent.trim()).toBe(themeTranslation?.title ?? theme.internal_name)
    expect(essayTitle?.textContent.trim()).not.toBe(theme.internal_name)
    const essayBody = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
    if (themeTranslation?.description) {
      expect(essayBody?.textContent.trim().length).toBeGreaterThan(0)
    }

    app.unmount()
  }, 30000)

  it('declares every route by name, and leaves the catch-all to the router', () => {
    // This website has never been published under another URL shape, so
    // there is no legacy path to require here.
    expect(checkRoutes(config, {
      names: [
        'home', 'permanent-collection', 'permanent-collection-results', 'database', 'database-results',
        'timeline', 'timeline-results', 'timeline-gallery', 'partners', 'partners-results', 'partner',
        'artistic-introduction', 'artistic-introduction-theme', 'exhibitions', 'exhibition',
        'exhibition-introduction', 'exhibition-theme', 'item',
      ],
    })).toEqual([])
    expect(config.legacyRoutes).toEqual([])
    // Decision D5: the dynasties list/sheet were an addition over legacy
    // (which only ever popped dynasties up from an item sheet); the item
    // sheet's own popout (metanull/islamicart#50) is their only trace now.
    const names = config.extraViews.map((r) => r.name)
    expect(names).not.toContain('dynasties')
    expect(names).not.toContain('dynasty')
  })

  it('declares the entities every route reads', () => {
    // A view that renders records against `null` is the failure this prevents:
    // the router loads what a route names before the view is created.
    for (const route of config.extraViews) {
      expect(Array.isArray(route.meta?.entities), route.name).toBe(true)
    }
    expect(config.extraViews.find((r) => r.name === 'item').meta.entities).toContain('items')
  })

  it('declares the section every route belongs to', () => {
    // The menu highlights the current section by reading `meta.section`
    // (viewer-core's `useSection()`); a route without one leaves the menu
    // with nothing active.
    expect(checkSectionMeta(config)).toEqual([])
  })

  // The record lookups are viewer-core's shared indexes now, and a Map is not
  // an object: `byId(...)[id]` reads as undefined rather than failing, so a
  // page would simply render nothing. This is where that shows.
  it('resolves a record through the shared index', async () => {
    const { loadEntities } = await import('@museumwnf/viewer-core')
    const { itemById } = useData()
    const [items] = await loadEntities(['items'])
    expect(itemById.value).toBeInstanceOf(Map)
    expect(itemById.value.get(items[0].id)).toBe(items[0])
  }, 20000)

  it('offers the languages the package declares for the site, where the items carry them', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
    expect(config.languages).toContain('en')
    // Languages declared in the manifest but with zero translation files
    // (fa, he, ru, ch as of data package 1.0.26) must not be offered.
    for (const phantom of ['fa', 'he', 'ru', 'ch']) {
      expect(config.languages).not.toContain(phantom)
    }
    // Labels resolve to real language names where the package declares one.
    const switcher = config.navigation.languages
    expect(switcher.map((l) => l.code)).toEqual(config.languages)
    expect(switcher.every((l) => Boolean(l.label))).toBe(true)
  })

  // The chrome is now two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. These assert the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link and the menu's first entry.
    expect(text).toContain('Skip to content')
    expect(text).toContain('Home')
    // From locales/en.json: the header lockup, a menu entry, the footer.
    expect(text).toContain('Museum With No Frontiers')
    expect(text).toContain('Permanent Collection')
    expect(text).toContain('Welcome to Islamic Art')

    // The footer attribution (islamicart#58): once the data package's
    // manifest.rights names a holder, viewer-layout's SiteShell renders it
    // unasked — the sentence and the terms link are the package's own facts,
    // not this website's.
    const { default: manifest } = await import('@museumwnf/islamicart-data/manifest.json', { assert: { type: 'json' } })
    const attribution = host.querySelector('.mwnf-footer__attribution')
    expect(attribution).not.toBeNull()
    expect(attribution.textContent).toContain(manifest.rights.attribution)
    const termsLink = attribution.querySelector('a')
    expect(termsLink.textContent.trim()).toBe('Terms of use')
    expect(termsLink.getAttribute('href')).toBe(manifest.rights.terms_url)

    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one. Every namespace
    // this website's pages read, not only this file's own — a raw shared
    // key would otherwise leak past the check unseen.
    expect(checkTextsRendered(host, {
      namespaces: ['islamicart', 'core', 'layout', 'catalogue', 'record', 'sheet', 'timeline', 'partner', 'exhibition'],
    })).toEqual([])

    app.unmount()
  }, 20000)
})
