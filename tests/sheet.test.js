import { describe, expect, it } from 'vitest'
import { itemSheetSpec } from '../src/composables/sheet.js'

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
      expect(field.label).toBe('sheet.field.periodDynasty')
      expect(field.value({ record, translations, text: { dynasty: 'Mamluk period.' } })).toBe('Mamluk period')
    }
    expect(row(fieldsOf(object), 'dynasty').value({ record: object, translations, text: {} })).toBe('Mamluks')
    expect(row(fieldsOf(monument), 'dynasty').value({ record: monument, translations, text: {} })).toBe('')
  })

  it('prints the materials under Material(s) / Technique(s), not the type of object', () => {
    const field = row(fieldsOf(object), 'materials')
    expect(field.label).toBe('sheet.field.materials')
    expect(field.value({ record: object, text: { materials: ['Brass', 'inlaid with silver'], type: 'Basin' } }))
      .toEqual(['Brass', 'inlaid with silver'])
    expect(field.join).toBe('; ')
  })

  it('prints the artist alone, as legacy did', () => {
    const text = { artist_birthdate: '1500' }
    expect(row(fieldsOf(object), 'artists').value({ record: object, text })).toEqual(['Ali'])
  })

  it('closes both sheets with the rights line', () => {
    for (const record of [object, monument]) {
      expect(sectionsOf(record).at(-1)).toMatchObject({ key: 'copyright', label: 'sheet.field.copyrightInformation', value: 'copyright' })
    }
  })
})

describe('item sheet spec, languages', () => {
  it('prints no linked dynasty name in a language the dynasty has no text in', () => {
    const none = () => ({})
    expect(row(fieldsOf(object), 'dynasty').value({ record: object, translations: none, text: {} })).toBe('')
  })
})
