import { describe, expect, it } from 'vitest'
import { itemSheetSpec, legacyCitation } from '../src/composables/sheet.js'
import { PROJECTS } from '../src/dataset.config.js'

// The item sheet's own rows, over a hand-built record and translation: the
// fields the legacy-parity story (inventory-app#2233) added to the package —
// the free-text Period / Dynasty line, the materials and the rights line —
// read the way legacy `database_item.php` printed them.

const object = { id: 'o1', type: 'object', dynasty_ids: ['d1'], artist_names: ['Ali'] }
const monument = { id: 'm1', type: 'monument', dynasty_ids: [] }
// RecordView's strict accessor: the sheet language's rows of one entity.
const translations = (entity) => (entity === 'dynasties' ? { d1: { name: 'Mamluks' } } : {})

const row = (list, key) => list.find((f) => f.key === key)
const fieldsOf = (record) => itemSheetSpec.fields({ record })
const sectionsOf = (record) => itemSheetSpec.sections({ record })

describe('item sheet spec', () => {
  it('prints the free-text Period / Dynasty line without its ending period, else the linked names', () => {
    for (const record of [object, monument]) {
      const field = row(fieldsOf(record), 'dynasty')
      expect(field.label).toBe('islamicart.sheet.periodDynasty')
      expect(field.value({ record, translations, text: { dynasty: 'Mamluk period.' } })).toBe('Mamluk period')
    }
    expect(row(fieldsOf(object), 'dynasty').value({ record: object, translations, text: {} })).toBe('Mamluks')
    expect(row(fieldsOf(monument), 'dynasty').value({ record: monument, translations, text: {} })).toBe('')
  })

  it('prints the fields legacy stripped without their ending period, the others as written', () => {
    const text = { name: 'Madrasa.', dates: 'Hegira 770 / AD 1368.', holder: 'Museum.', dimensions: 'H. 10 cm.', patrons: 'Sultan.' }
    const value = (record, key) => row(fieldsOf(record), key).value({ record, translations, text })
    expect(value(monument, 'name')).toBe('Madrasa')
    expect(value(monument, 'date')).toBe('Hegira 770 / AD 1368')
    expect(value(object, 'holder')).toBe('Museum')
    expect(value(object, 'dimensions')).toBe('H. 10 cm')
    expect(value(object, 'inventoryNumber')).toBe('')
    expect(row(fieldsOf(object), 'patrons').value).toBe('patrons')
  })

  it('prints the materials under Material(s) / Technique(s), not the type of object', () => {
    const field = row(fieldsOf(object), 'materials')
    expect(field.label).toBe('islamicart.sheet.materials')
    expect(field.value({ record: object, text: { materials: ['Brass', 'inlaid with silver'], type: 'Basin' } }))
      .toEqual(['Brass', 'inlaid with silver'])
    expect(field.join).toBe('; ')
  })

  it("prints the page's language's own artist line, alone, as legacy did", () => {
    expect(row(fieldsOf(object), 'artists').value).toBe('artist')
  })

  it("prints the location, the province and the country's name, as legacy's Location line", () => {
    const countries = (entity) => (entity === 'countries' ? { gbr: { name: 'United Kingdom' }, pse: { name: 'Palestine' } } : {})
    const value = (record, text) => row(fieldsOf(record), 'location').value({ record, translations: countries, text })
    expect(value({ ...object, country_id: 'gbr' }, { location: 'London, England.' })).toBe('London, England, United Kingdom')
    expect(value({ ...monument, country_id: 'gbr' }, { location: 'Süleymaniye, Istanbul', province: 'Marmara' }))
      .toBe('Süleymaniye, Istanbul, Marmara, United Kingdom')
    // A country with no name in the sheet's language adds nothing.
    expect(value({ ...object, country_id: 'xyz' }, { location: 'Somewhere' })).toBe('Somewhere')
  })

  // inventory-app#2429: the package carries a monument's address apart.
  it("opens a monument's Location line with its address, each of its lines kept, as legacy's nl2br", () => {
    const countries = (entity) => (entity === 'countries' ? { pse: { name: 'Palestine' } } : {})
    const value = (record, text) => row(fieldsOf(record), 'location').value({ record, translations: countries, text })
    const hebron = { ...monument, country_id: 'pse', mwnf_reference: 'PA 12' }
    expect(value(hebron, { address: 'Near the south-west corner\r\nof the Old City.', location: 'Hebron' }))
      .toBe('Near the south-west corner  \nof the Old City, Hebron, Palestine')
    expect(value(hebron, { location: 'Hebron' })).toBe('Hebron, Palestine')
    // An object's line never had an address.
    expect(value({ ...object, country_id: 'pse' }, { address: 'Street 1', location: 'Hebron' })).toBe('Hebron, Palestine')
  })

  it('names no country where legacy named none: the Palestinian museum, the listed Palestinian monuments', () => {
    const countries = (entity) => (entity === 'countries' ? { pse: { name: 'Palestine' } } : {})
    const value = (record) => row(fieldsOf(record), 'location').value({ record, translations: countries, text: { location: 'Jerusalem' } })
    expect(value({ ...object, country_id: 'pse', partner_id: '325b7505-1527-5442-99ea-6a40f8c43d3f' })).toBe('Jerusalem')
    expect(value({ ...object, country_id: 'pse', partner_id: 'another-partner' })).toBe('Jerusalem, Palestine')
    expect(value({ ...monument, country_id: 'pse', mwnf_reference: 'PA 25' })).toBe('Jerusalem')
    expect(value({ ...monument, country_id: 'pse', mwnf_reference: 'PA 12' })).toBe('Jerusalem, Palestine')
  })

  it('closes both sheets with the rights line', () => {
    for (const record of [object, monument]) {
      expect(sectionsOf(record).at(-1)).toMatchObject({ key: 'copyright', label: 'islamicart.sheet.copyrightInformation', value: 'copyright' })
    }
  })
})

describe('item sheet spec, languages', () => {
  it('prints no linked dynasty name in a language the dynasty has no text in', () => {
    const none = () => ({})
    expect(row(fieldsOf(object), 'dynasty').value({ record: object, translations: none, text: {} })).toBe('')
  })

  it("cites as legacy: the name without its ending period, the project's phrase, the year, the address", () => {
    const words = { 'islamicart.sheet.citationIsl': 'in *Discover Islamic Art*, MWNF,', 'islamicart.sheet.citationEpm': 'in *Explore*. MWNF,' }
    const t = (key) => words[key]
    const c = { record: { id: 'x1', project_id: 'other' }, text: { name: 'Bowl & cup.' }, t }
    expect(legacyCitation(c, { permalink: 'https://example.org/#/item/x1', year: 2026 }))
      .toBe('"Bowl &amp; cup" in <em>Discover Islamic Art</em>, MWNF, 2026. <br><i>https://example.org/#/item/x1</i>')
    const explore = { ...c, record: { id: 'x2', project_id: PROJECTS.explore } }
    expect(legacyCitation(explore, { year: 2026 })).toBe('"Bowl &amp; cup" in <em>Explore</em>. MWNF, 2026.')
  })
})
