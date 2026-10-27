import { useCollectionTree } from '@museumwnf/viewer-core'
import minisites from '../minisites.json'
import { useData } from './data.js'

// The Exhibitions tree — exhibitions-root → exhibition → theme → page. Each
// exhibition is a website of its own now, a mini-site (inventory-app#2359):
// this site lists them and links to them, and its package keeps of them only
// what it shows — each exhibition's and theme's title, and which items each
// page places, in their order. Where each one lives is this site's own
// configuration, src/minisites.json (exhibition id → its address).

const { tr } = useData()

// The whole tree, read by the list and by an item sheet's "on display in".
export const exhibitionsTree = useCollectionTree({ purpose: 'exhibitions-root', entity: 'collections' })

/**
 * An exhibition's mini-site, in the page language: its home page, or one of
 * its pages by the theme's and the page's numbers (1-based, in the order the
 * mini-site reads them). Null for an exhibition with no mini-site.
 */
export function minisiteHref(exhibitionId, language, at = null) {
  const base = minisites[exhibitionId]
  if (!base) return null
  const query = language ? `?lang=${encodeURIComponent(language)}` : ''
  return at ? `${base}#/exhibition/${at.theme}/${at.page}${query}` : `${base}#/${query}`
}

/** The 1-based position of `id` among its siblings, in the tree's order. */
function position(parentId, id) {
  return exhibitionsTree.children(parentId).findIndex((node) => node.id === id) + 1
}

// What legacy's item sheet listed under "On display in › Exhibitions"
// (modules/database_item.php): every exhibition page that places the item,
// once per exhibition and theme, the first such page, linked there.
export function exhibitionLinksForItem(itemId) {
  const seen = new Set()
  const links = []
  const root = exhibitionsTree.root.value
  for (const node of exhibitionsTree.containing(itemId)) {
    // A page's ancestry runs past the exhibitions root to the project above
    // it: the page is the third level below that root.
    const parents = exhibitionsTree.parents(node.id)
    const at = parents.findIndex((p) => p.id === root?.id)
    if (at < 0 || parents.length !== at + 3) continue
    const [exhibition, theme] = parents.slice(at + 1)
    const key = `${exhibition.id}:${theme.id}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({
      exhibitionId: exhibition.id,
      at: { theme: position(exhibition.id, theme.id), page: position(theme.id, node.id) },
      label: tr('collections', exhibition.id).title ?? exhibition.internal_name,
    })
  }
  return links
}
