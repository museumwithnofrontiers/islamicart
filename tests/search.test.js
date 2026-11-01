import { describe, expect, it } from 'vitest'
import { SEARCH_FIELDS, SEARCH_SCORE } from '../src/composables/catalogue.js'

// The columns legacy's database_results.php searched (inventory-app#2415),
// as the package names them: a change here changes what a visitor finds.
const TEXT = [
  'name', 'alternate_name', 'location', 'province', 'dates', 'dynasty', 'initial_owner', 'artist', 'keywords',
  'materials', 'description', 'short_description', 'method_for_datation', 'type', 'owner', 'provenance',
  'dimensions', 'artist_birthdate', 'artist_birthplace', 'artist_deathdate', 'artist_deathplace',
  'place_of_production', 'workshop', 'method_for_provenance', 'obtention', 'bibliography', 'author', 'holder',
  'architects', 'patrons', 'address', 'history',
]
const ITEM = ['mwnf_reference', 'owner_reference', 'start_date', 'end_date']

const text = Object.fromEntries(TEXT.map((key) => [key, `t:${key}`]))
const record = (type) => ({ type, ...Object.fromEntries(ITEM.map((key) => [key, `i:${key}`])) })
const read = (field, type) => [SEARCH_FIELDS[field](record(type), text)].flat().filter(Boolean).sort()

describe('the Database search fields', () => {
  it('searches every column legacy searched for Keywords', () => {
    const expected = [...TEXT.map((k) => `t:${k}`), ...ITEM.map((k) => `i:${k}`)].sort()
    expect(read('keyword', 'object')).toEqual(expected)
    expect(read('keyword', 'monument')).toEqual(expected)
  })

  it('searches each other field in its own columns', () => {
    expect(read('name', 'object')).toEqual(['t:alternate_name', 't:name'])
    expect(read('location', 'object')).toEqual(['t:location', 't:province'])
    expect(read('dynasty', 'object')).toEqual(['t:architects', 't:dynasty'])
    expect(read('artist', 'object')).toEqual(['t:artist'])
    expect(read('artist', 'monument')).toEqual(['t:architects', 't:dynasty'])
    expect(read('provenance', 'object')).toEqual(['t:provenance'])
    expect(read('provenance', 'monument')).toEqual([])
    expect(read('material', 'object')).toEqual(['t:materials'])
    expect(read('material', 'monument')).toEqual([])
    expect(read('patron', 'monument')).toEqual(['t:patrons'])
    expect(read('patron', 'object')).toEqual([])
  })

  it('weighs a match as legacy did', () => {
    const like = (...keys) => (value) => keys.some((key) => String(value).endsWith(`:${key}`))
    expect(SEARCH_SCORE.keyword(like('keywords', 'mwnf_reference', 'name', 'alternate_name'), record('object'), text, true)).toBe(7)
    expect(SEARCH_SCORE.keyword(like('description'), record('object'), text, false)).toBe(0)
    expect(SEARCH_SCORE.name(like('name'), record('object'), text)).toBe(1)
    expect(SEARCH_SCORE.location(like('name'), record('object'), text)).toBe(1)
  })
})
