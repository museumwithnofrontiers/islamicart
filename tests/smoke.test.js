import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages, projectLabel, useDataPackage } from '@museumwnf/viewer-core'
import { checkOfferedLanguages, checkRoutes, checkSectionMeta, checkTextsRendered, mountSite as mountOn } from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import config, { PROJECTS } from '../src/dataset.config.js'
import { useData } from '../src/composables/data.js'
import minisites from '../src/minisites.json'

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

    expect(host.querySelector('.mwnf-page')).not.toBeNull()
    // The header's mark is legacy's logo, named after the site.
    expect(host.querySelector('.mwnf-header__brand-logo').getAttribute('alt')).toBe('Discover Islamic Art - Virtual Museum')

    // The home route renders legacy's home page (inventory-app#2233, S1):
    // the standalone family's chrome around the side links and the item of
    // the day — no card grid, no welcome text legacy never had (D2).
    expect(host.querySelector('.vc-home')).toBeNull()
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-highlight')).not.toBeNull(), { timeout: 15000 })
    expect(host.querySelector('.mwnf-cards')).toBeNull()
    expect(host.querySelector('.mwnf-page').classList.contains('mwnf-standalone--home')).toBe(true)
    expect([...host.querySelectorAll('.mwnf-standalone-home__links li')].map((li) => li.textContent.trim())).toEqual([
      'Recommended Links', 'Credits', 'Mission Statement', 'Visit Explore Islamic Art Collections',
    ])
    expect(host.querySelector('.mwnf-standalone-highlight__heading').textContent).toBe('Today’s highlight from the Permanent Collection')
    expect(host.querySelector('.mwnf-standalone-highlight__image')).not.toBeNull()
    expect(host.querySelector('.mwnf-banner__image').getAttribute('src')).toContain('banner')
    // The sponsor band, on the home page only.
    expect(host.querySelector('.mwnf-sponsors').textContent).toContain('Discover Islamic Art was set up with the support of:')
    expect(host.querySelector('.mwnf-sponsors').textContent).toContain('Arabic version')

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
  // Legacy's pclist_all.php: the heading with its count, the tiles, the
  // "Change your selection" panel and legacy's pages, no filter form and no
  // summary line of the composed view's own.
  it("renders the Permanent Collection results as legacy's tiles, panel and pages", async () => {
    const { app, host } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-results__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelectorAll('.mwnf-standalone-results__tile').length).toBe(20)
    expect(host.querySelector('.islamicart-pcr__heading').textContent).toContain('Permanent Collection')
    expect(host.querySelectorAll('.islamicart-pcr__panel select').length).toBe(4)
    // Legacy's centuries, read from the timeline: "400 A.D." to start.
    await vi.waitFor(() => expect(host.querySelectorAll('.islamicart-pcr__date select')[0].options.length).toBeGreaterThan(1), { timeout: 20000 })
    expect(host.querySelectorAll('.islamicart-pcr__date select')[0].options[1].textContent).toMatch(/^\d+ A\.D\.$/)
    expect(host.querySelector('.mwnf-standalone-pages')).not.toBeNull()
    expect(host.querySelector('.mwnf-filter')).toBeNull()
    expect(host.querySelector('.mwnf-summary')).toBeNull()
    expect(host.querySelector('.mwnf-pagination')).toBeNull()
    app.unmount()
  }, 60000)

  // Legacy's pclist_all.php always read the Discover Islamic Art and the
  // Explore Islamic Art Collections records together. The tile count alone
  // would not show this — a page holds twenty regardless — so this reads the
  // heading's "[N Objects, M Monuments]" against the package.
  // The composed view's summary total, which the database search still shows.
  function summaryTotal(host) {
    return [...host.querySelectorAll('.mwnf-summary__count')]
      .reduce((sum, el) => sum + Number(el.textContent), 0)
  }

  function headingTotal(host) {
    const [, objects = '0', monuments = '0'] = host.querySelector('.islamicart-pcr__count').textContent
      .match(/\[(?:(\d+) Objects)?(?:, )?(?:(\d+) Monuments)?\]/) ?? []
    return Number(objects) + Number(monuments)
  }

  it('lists both projects in the Permanent Collection, as legacy did', async () => {
    const [items] = await loadEntities(['items'])
    const projects = [PROJECTS.discover, PROJECTS.explore]
    const expected = items.filter((i) => !i.project_id || projects.includes(i.project_id)).length
    expect(items.some((i) => i.project_id === PROJECTS.explore)).toBe(true)

    const { app, host } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(host.querySelector('.islamicart-pcr__count')).not.toBeNull(), { timeout: 20000 })
    const total = headingTotal(host)
    app.unmount()

    expect(total).toBe(expected)
  }, 60000)

  // Legacy's panel replaced the selection: a dynasty picked on a country's
  // results shows the dynasty alone; the country's results link its
  // timeline.
  it('names the country in the heading, links its timeline, and lets a dynasty replace it', async () => {
    const { app, host } = await mountSite('#/permanent-collection/results?country=ita')
    await vi.waitFor(() => expect(host.querySelector('.islamicart-pcr__related a')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.islamicart-pcr__heading b').textContent).toBe('Italy')
    expect(host.querySelector('.islamicart-pcr__related a').textContent).toBe('Timeline | Italy')

    const dynasty = host.querySelectorAll('.islamicart-pcr__panel select')[1]
    dynasty.value = dynasty.options[1].value
    dynasty.dispatchEvent(new Event('change'))
    await vi.waitFor(() => expect(window.location.hash).toContain('dynasty='), { timeout: 20000 })
    expect(window.location.hash).not.toContain('country=')
    app.unmount()
  }, 60000)

  // Displayed data follows the display language, reference data included
  // (inventory-app#2414). As on legacy's pclist_all.php?lng=fr: the country
  // is named in French, and a tile whose item has no French text stays
  // English, its country too ("Turin, Italy" beside "Rome, Italie").
  it('names countries in the display language, and in English beside an item left in English', async () => {
    const { app, host } = await mountSite('#/permanent-collection/results?country=ita&lang=fr')
    await vi.waitFor(() => expect(host.querySelector('.islamicart-pcr__heading b')?.textContent).toBe('Italie'), { timeout: 20000 })
    const places = () => [...host.querySelectorAll('.mwnf-standalone-results__panel')]
      .map((panel) => [...panel.querySelectorAll('p')].map((p) => p.textContent.trim()))
    await vi.waitFor(() => expect(places().some((lines) => lines.includes('Rome, Italie'))).toBe(true), { timeout: 20000 })
    expect(places().some((lines) => lines.includes('Turin, Italy'))).toBe(true)
    expect(places().flat()).not.toContain('Turin, Italie')
    app.unmount()
    // The visit remembers its language; the tests after this one read English.
    localStorage.removeItem('mwnf.language')
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

  // The Permanent Collection entrance as legacy's pc_entrance.php: "Sort by"
  // and its five lists, "About" and legacy's text; picking a value opens the
  // results at once, as legacy's onchange did. The lists' values are the
  // records' own (composables/catalogue.js's `FACETS`).
  it("renders the Permanent Collection entrance as legacy's, opening the results on a pick", async () => {
    const { app, host } = await mountSite('#/permanent-collection?lang=en')
    await vi.waitFor(() => expect(host.querySelectorAll('.islamicart-pc select').length).toBe(5), { timeout: 20000 })
    const headings = [...host.querySelectorAll('.islamicart-pc__heading')].map((h) => h.textContent.trim())
    expect(headings).toEqual(['Sort by', 'About'])
    expect(host.querySelector('.islamicart-pc__text').textContent).toContain('four ways to sort')
    const country = host.querySelector('.islamicart-pc select')
    await vi.waitFor(() => expect(country.options.length).toBeGreaterThan(2), { timeout: 20000 })
    country.value = country.options[2].value
    country.dispatchEvent(new Event('change'))
    await vi.waitFor(() => expect(window.location.hash).toContain(`/permanent-collection/results?country=${country.value}`), { timeout: 20000 })
    app.unmount()
  }, 30000)
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
  // links — fills the view's slots. A monument and an object read different
  // field orders (composables/sheet.js), so both are mounted.
  it('renders an object sheet on the composed record view', async () => {
    const [items] = await loadEntities(['items'])
    const object = items.find((i) => i.type === 'object')
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(object.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    // Legacy's three columns (S2): the way back and the pictures, the sheet,
    // the Related Content column with its print link.
    const main = host.querySelector('.mwnf-record__main')
    expect(main.querySelector(':scope > .mwnf-standalone-item__left .mwnf-media')).not.toBeNull()
    expect([...main.querySelectorAll('.mwnf-standalone-item__back-link')].map((l) => l.textContent.trim()))
      .toEqual(['Back', 'Collection start page'])
    expect(main.querySelector(':scope > .mwnf-sheet')).not.toBeNull()
    const related = main.querySelector(':scope > .mwnf-standalone-related')
    expect(related.querySelector('.mwnf-standalone-related__heading').textContent).toBe('Related Content')
    expect(related.querySelector('.mwnf-standalone-related__print').textContent).toBe('As PDF (including images)')

    // The citation's source credit (islamicart#58): `sourceUrl()` only
    // produces an address once the website declares `site.origin`
    // (dataset.config.js), and `itemSheetSpec`'s citation carries no permalink
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

  // #1727 cleanup: `itemSheetSpec` (composables/sheet.js) no longer names a
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
    const labels = [...host.querySelectorAll('.mwnf-sheet__label')].map((el) => el.textContent.trim())
    // A monument's date reads legacy's "Date of Monument:", an object's "Date
    // of Object:" — the two specs in composables/sheet.js name the same field
    // differently, and a monument reads no holding museum.
    expect(labels).toContain('Date of Monument:')
    expect(labels).not.toContain('Date of Object:')
    expect(labels).not.toContain('Holding Museum:')
    app.unmount()
  }, 60000)

  // Discover Islamic Art's partner museums as legacy's pm_partner_list.php
  // (PartnerList.vue): a row a country with its main museums, and "See
  // Associated Museums" opening that country's associated ones, the "Further
  // Associated" entry last, and closing any other. Jordan is picked because
  // the data package nests associated museums under its main one (G.1's
  // `level`/`parent_id`).
  it("renders Discover's partner museums as legacy's list, a country's associated museums behind its toggle", async () => {
    const { app, host } = await mountSite(`#/partners/results?type=museum&project=${PROJECTS.discover}&lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.islamicart-pl__country')).not.toBeNull(), { timeout: 20000 })

    expect([...host.querySelectorAll('.islamicart-pl__heads h3')].map((h) => h.textContent)).toEqual(['Partner Museums', 'Associated Museums'])
    const countries = [...host.querySelectorAll('.islamicart-pl__country')]
    expect(countries.map((c) => c.querySelector('h3').textContent)[0]).toBe('Algeria')
    const jordan = countries.find((c) => c.querySelector('h3').textContent === 'Jordan')
    expect(jordan.querySelector('.islamicart-pl__main').textContent).toBe('Jordan Archaeological Museum')

    const associated = jordan.querySelector('.islamicart-pl__associated')
    expect(associated.style.display).toBe('none')
    jordan.querySelector('.islamicart-pl__toggle').click()
    await vi.waitFor(() => expect(associated.style.display).toBe(''))
    const names = [...associated.querySelectorAll('p')].map((p) => p.textContent)
    expect(names.at(-1)).toBe('Further Associated Museums')
    expect(names).toContain('Al-Saraya Museum')
    // Opening Italy closes Jordan.
    countries.find((c) => c.querySelector('h3').textContent === 'Italy').querySelector('.islamicart-pl__toggle').click()
    await vi.waitFor(() => expect(associated.style.display).toBe('none'))

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
    // "View Objects" opens the partner's own page of tiles.
    expect(viewItems.getAttribute('href')).toContain(`#/partner/${museum.id}/items`)

    app.unmount()
  }, 60000)

  // Legacy's pm_museum_items.php / pm_institution_items.php: a museum's
  // objects of both projects, an institution's monuments, in the Permanent
  // Collection's order and tiles, under the partner's name and place, with
  // the way back to its list and "Partner Profile" beside the tiles.
  it("renders a partner's objects or monuments as legacy's own page", async () => {
    const [items, partners] = await loadEntities(['items', 'partners'])
    const rome = partners.find((p) => p.id === '2970af60-fdee-5b70-8e87-7b8865a0c88d')
    const objects = items.filter((i) => i.partner_id === rome.id && i.type === 'object')
    const { app, host } = await mountSite(`#/partner/${rome.id}/items?lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-results__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.islamicart-pmi__heading h3').textContent).toBe('Museum of Civilisations | Museum of Oriental Art')
    expect(host.querySelector('.islamicart-pmi__heading p').textContent).toBe('Rome, Italy')
    expect([...host.querySelectorAll('.islamicart-pcr__back > *')].map((el) => el.textContent)).toEqual(['Back', 'Partner Museums', 'Other Partners'])
    expect(host.querySelectorAll('.mwnf-standalone-results__tile').length).toBe(Math.min(20, objects.length))
    expect(host.querySelector('.mwnf-standalone-results__name').textContent).toBe('Coin (dirham)')
    expect(host.querySelector('.islamicart-pcr__related a').getAttribute('href')).toContain(`#/partner/${rome.id}`)
    expect(host.querySelector('.mwnf-standalone-pages')).not.toBeNull()
    app.unmount()

    const jordan = partners.find((p) => p.id === '804de1a6-e288-5381-8982-10883c9b8fcb')
    const second = await mountSite(`#/partner/${jordan.id}/items?lang=en`)
    await vi.waitFor(() => expect(second.host.querySelector('.mwnf-standalone-results__tile')).not.toBeNull(), { timeout: 20000 })
    expect(second.host.querySelector('.mwnf-standalone-results__name').textContent).toBe('Church of the Virgin Mary: mosaic floor')
    second.app.unmount()
  }, 60000)

  // Each exhibition is a website of its own (a mini-site, inventory-app#2359):
  // this site lists the exhibitions and links each to its own address
  // (src/minisites.json), and an item sheet links the exhibition pages that
  // place the item, on the mini-site.
  it('lists the exhibitions, each leading to its own website', async () => {
    const [collections] = await loadEntities(['collections'])
    const root = collections.find((c) => c.purpose === 'exhibitions-root')
    expect(root).toBeTruthy()
    const exhibitions = collections.filter((c) => c.parent_id === root.id)
    for (const exhibition of exhibitions) expect(minisites[exhibition.id], exhibition.internal_name).toMatch(/^https:\/\//)

    const { app, host } = await mountSite('#/exhibitions?lang=en')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Exhibitions')
    const hrefs = Array.from(host.querySelectorAll('.mwnf-cards__link')).map((a) => a.getAttribute('href'))
    expect(hrefs).toHaveLength(exhibitions.length)
    for (const href of hrefs) expect(Object.values(minisites).some((base) => href.startsWith(base))).toBe(true)
    app.unmount()
  }, 30000)

  it('links an item to the exhibition pages that place it, on the mini-site', async () => {
    const [collections] = await loadEntities(['collections'])
    const byId = new Map(collections.map((c) => [c.id, c]))
    const up = (c, n) => (n === 0 || !c ? c : up(byId.get(c.parent_id), n - 1))
    const root = collections.find((c) => c.purpose === 'exhibitions-root')
    // A page: three levels below the exhibitions (exhibition, theme, page).
    const page = collections.find((c) => (c.items?.length ?? 0) > 0 && up(c, 3)?.id === root.id)
    expect(page).toBeTruthy()

    const { app, host } = await mountSite(`#/item/${encodeURIComponent(page.items[0].id)}?lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-on-display a[href*="#/exhibition/"]')).not.toBeNull(), { timeout: 20000 })
    const link = host.querySelector('.mwnf-on-display a[href*="#/exhibition/"]')
    expect(link.getAttribute('href')).toMatch(/^https:\/\/museumwithnofrontiers\.github\.io\/islamicart-[a-z-]+\/#\/exhibition\/\d+\/\d+\?lang=en$/)
    app.unmount()
  }, 30000)

  // The Artistic Introduction is a website of its own too (a mini-site,
  // inventory-app#2359): an item sheet links the page that places the item,
  // on the mini-site.
  it("links every item to the Artistic Introduction's home page, on its mini-site, as legacy's sheet did", async () => {
    const [collections, items] = await loadEntities(['collections', 'items'])
    const marker = collections.find((c) => c.purpose === 'artistic-introduction-root')
    const root = collections.find((c) => c.parent_id === marker.id)
    expect(minisites[root.id]).toMatch(/^https:\/\//)

    const { app, host } = await mountSite(`#/item/${encodeURIComponent(items[0].id)}?lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.islamicart-artintro-link a')).not.toBeNull(), { timeout: 20000 })
    const link = host.querySelector('.islamicart-artintro-link a')
    expect(link.getAttribute('href')).toBe(`${minisites[root.id]}#/?lang=en`)
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
        'mission-statement', 'recommended-links', 'dynasties', 'dynasty', 'dynasty-related',
      ],
    })).toEqual([])
    expect(config.legacyRoutes).toEqual([])
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

  // Legacy's menu (S3), in its order, and its footer (T2): every label is
  // legacy's own word, extracted into locales/.
  it("draws legacy's menu and footer", async () => {
    const { app, host } = await mountSite('#/database')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-nav__link')).not.toBeNull(), { timeout: 15000 })
    expect([...host.querySelectorAll('.mwnf-nav__link')].map((l) => l.textContent.trim())).toEqual([
      'Permanent Collection', 'Database', 'Exhibitions', 'Artistic Introduction', 'Partners', 'Timeline', 'Islamic Dynasties', 'My Collection',
    ])
    const footer = [...host.querySelectorAll('.mwnf-footer__link')]
    expect(footer.map((l) => l.textContent.trim())).toEqual([
      'About MWNF', 'Contact', 'Legal Notice', 'Credits', 'Language Policy', 'Cookies',
    ])
    expect(footer[4].getAttribute('href')).toBe('https://www.museumwnf.org/about/language-policy')
    // Legacy's six social icons follow the line (T1).
    expect(host.querySelectorAll('.mwnf-footer__social-link')).toHaveLength(6)
    // An inner page: the menu above the titled band, the heading, the Home
    // link, no sponsor band.
    const html = host.innerHTML
    expect(html.indexOf('mwnf-nav')).toBeLessThan(html.indexOf('mwnf-standalone-banner'))
    expect(host.querySelector('.mwnf-header__title').textContent.trim()).toBe('Discover Islamic Art')
    expect([...host.querySelectorAll('.mwnf-header__link')].map((l) => l.textContent.trim())).toEqual(['MWNF Portal', 'Home'])
    expect(host.querySelector('.mwnf-standalone-banner').textContent.trim()).toBe('Database')
    expect(host.querySelector('.mwnf-sponsors')).toBeNull()
    app.unmount()
  }, 60000)

  // Islamic Dynasties (Pascal, 2026-10-20): legacy's /dynasties/ client rebuilt
  // from the package — the start page with its picker and introduction, a
  // dynasty's profile, its related objects.
  it('renders the Islamic Dynasties section from the package', async () => {
    const pkg = useDataPackage()
    const names = await pkg.loadTranslations('dynasties', 'en')
    const [id, umayyads] = Object.entries(names).find(([, t]) => t.name === 'Umayyads of al-Andalus')

    const { app, host } = await mountSite('#/dynasties')
    await vi.waitFor(() => expect(host.querySelectorAll('.dynasties-entrance option').length).toBeGreaterThan(50), { timeout: 15000 })
    expect(host.querySelector('.mwnf-standalone-banner').textContent.trim()).toBe('Islamic Dynasties')
    expect(host.querySelector('.mwnf-nav__link--active').textContent.trim()).toBe('Islamic Dynasties')
    expect(host.querySelector('.dynasties-entrance__intro').textContent).toContain('What do we intend by')
    expect(host.querySelector('.dynasties-entrance button').textContent).toBe('GO')
    app.unmount()

    const { app: profile, host: profileHost } = await mountSite(`#/dynasties/${id}`)
    await vi.waitFor(() => expect(profileHost.querySelector('.dynasty__history')).not.toBeNull(), { timeout: 15000 })
    expect(profileHost.querySelector('.dynasty__name').textContent).toContain('Umayyads of al-Andalus')
    expect(profileHost.querySelector('.dynasty__name').textContent).toContain(`Also known as: ${umayyads.also_known_as}`)
    expect(profileHost.querySelector('.dynasty__when').textContent).toContain(`${umayyads.date_description_ah} / ${umayyads.date_description_ad}`)
    const related = [...profileHost.querySelectorAll('.dynasty__links a')]
    expect(related.map((a) => a.textContent.trim())).toEqual(expect.arrayContaining(['Related objects', 'Timeline', 'Artistic Introduction']))
    profile.unmount()

    const { app: objects, host: objectsHost } = await mountSite(`#/dynasties/${id}/objects`)
    await vi.waitFor(() => expect(objectsHost.querySelector('.dynasty-related__heading')).not.toBeNull(), { timeout: 20000 })
    expect(objectsHost.querySelector('.dynasty-related__heading').textContent.replace(/\s+/g, ' ').trim())
      .toMatch(/^\d+ Related Objects for Umayyads of al-Andalus$/)
    objects.unmount()
  }, 60000)

  // T6: the Mission Statement and the Recommended Links, legacy's own text.
  it('renders the Mission Statement and the Recommended Links from legacy', async () => {
    const { app, host } = await mountSite('#/mission-statement')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-page__body')).not.toBeNull(), { timeout: 15000 })
    expect(host.querySelector('.mwnf-standalone-banner').textContent.trim()).toBe('Mission Statement')
    expect(host.querySelector('.mwnf-standalone-page__body').textContent).toContain('Like the other great traditions of world art')
    expect(host.querySelector('.mwnf-standalone-page__link a').getAttribute('href')).toBe('#/permanent-collection')
    expect(host.querySelector('.mwnf-standalone-page__print-button').textContent).toBe('Print this page')
    app.unmount()

    const { app: links, host: linksHost } = await mountSite('#/recommended-links')
    await vi.waitFor(() => expect(linksHost.querySelector('.mwnf-standalone-page__body')).not.toBeNull(), { timeout: 15000 })
    const body = linksHost.querySelector('.mwnf-standalone-page__body')
    expect(body.querySelectorAll('h3')).toHaveLength(8)
    expect(body.querySelectorAll('h4')).toHaveLength(27)
    expect(body.querySelector('a').getAttribute('href')).toBe('http://islam.de/')
    links.unmount()
  }, 60000)

  // The chrome is now two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. These assert the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link.
    expect(text).toContain('Skip to content')
    // From locales/en.json, legacy's own words: the header link, a menu
    // entry, the footer's copyright.
    expect(text).toContain('MWNF Portal')
    expect(text).toContain('Permanent Collection')
    expect(text).toContain('© Museum With No Frontiers (MWNF) 2004 –')

    // The footer is legacy's: no rights-holder line, which legacy never
    // printed (Pascal, 2026-10-20; viewer-layout 3.4.0 makes it opt-in).
    expect(host.querySelector('.mwnf-footer__attribution')).toBeNull()

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
