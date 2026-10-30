import { computed } from 'vue'
import { useCollectionTree } from '@museumwnf/viewer-core'
import minisites from '../minisites.json'
import { useData } from './data.js'

// The Artistic Introduction tree: a purpose marker
// ("artistic-introduction-root") whose one child is the section's real
// root, the parent every theme hangs from (`useCollectionTree`'s own doc
// comment: "the sites that resolve a marker's single child as the real root
// themselves"). The Artistic Introduction is a website of its own now, a
// mini-site (inventory-app#2359): this site links to it, and its package
// keeps of it only what it shows — the introduction's and its themes'
// titles, and which items each page places (an item sheet's "on display
// in"). Where it lives is this site's own configuration, src/minisites.json
// (the introduction's id → its address).
export const artIntroTree = useCollectionTree({ purpose: 'artistic-introduction-root', entity: 'collections' })

// The marker's own single child.
export const artIntroRoot = computed(() => artIntroTree.children(artIntroTree.root.value?.id)[0] ?? null)

const { tr } = useData()

/**
 * The Artistic Introduction's mini-site, in the page language: its home
 * page, or a theme's page by the theme's and the page's numbers (1-based,
 * in the order the mini-site reads them). Null when it has no mini-site.
 */
export function artIntroHref(language, at = null) {
  const base = artIntroRoot.value ? minisites[artIntroRoot.value.id] : null
  if (!base) return null
  const query = language ? `?lang=${encodeURIComponent(language)}` : ''
  return at ? `${base}#/page/${at.theme}/${at.page}${query}` : `${base}#/${query}`
}

/** The 1-based position of `id` among its siblings, in the tree's order. */
export function artIntroPosition(parentId, id) {
  return artIntroTree.children(parentId).findIndex((node) => node.id === id) + 1
}

// The reverse lookup ItemDetail.vue renders as the Artistic Introduction
// section of "where this item appears": every theme whose page carries
// this item — items are attached to a theme's page, never the theme
// itself directly, mirroring `exhibitions.js`'s `exhibitionLinksForItem` —
// at the first such page.
export function artIntroLinksForItem(itemId) {
  const rootId = artIntroRoot.value?.id
  if (!rootId) return []
  const seen = new Set()
  const links = []
  for (const page of artIntroTree.containing(itemId)) {
    const theme = artIntroTree.byId.value.get(page.parent_id)
    if (!theme || theme.parent_id !== rootId || seen.has(theme.id)) continue
    seen.add(theme.id)
    links.push({
      themeId: theme.id,
      at: { theme: artIntroPosition(rootId, theme.id), page: artIntroPosition(theme.id, page.id) },
      label: tr('collections', theme.id).title ?? theme.internal_name,
    })
  }
  return links
}
