import { computed } from 'vue'
import { useCollectionTree } from '@museumwnf/viewer-core'
import { useData } from './data.js'

// The Artistic Introduction tree: a purpose marker
// ("artistic-introduction-root") whose one child is the section's real
// root — the entrance's own subtitle/description/credits, and the parent
// every theme hangs from (`useCollectionTree`'s own doc comment: "the
// sites that resolve a marker's single child as the real root
// themselves"). One instance for the whole site (unlike Exhibitions, which
// has one root per exhibition) — the entrance, every theme page and the
// item cross-link below all read this one tree.
export const artIntroTree = useCollectionTree({ purpose: 'artistic-introduction-root', entity: 'collections' })

// The marker's own single child. Never a page a visitor lands on — nothing
// above reads `artIntroTree.root` itself.
export const artIntroRoot = computed(() => artIntroTree.children(artIntroTree.root.value?.id)[0] ?? null)

const { tr } = useData()

// The reverse lookup ItemDetail.vue renders as the Artistic Introduction
// section of "where this item appears": every theme whose page carries
// this item — items are attached to a theme's page, never the theme
// itself directly, mirroring `exhibitions.js`'s `exhibitionLinksForItem`.
export function artIntroLinksForItem(itemId) {
  const rootId = artIntroRoot.value?.id
  if (!rootId) return []
  const seen = new Set()
  const links = []
  for (const page of artIntroTree.containing(itemId)) {
    const theme = artIntroTree.byId.value.get(page.parent_id)
    if (!theme || theme.parent_id !== rootId || seen.has(theme.id)) continue
    seen.add(theme.id)
    links.push({ themeId: theme.id, label: tr('collections', theme.id).title ?? theme.internal_name })
  }
  return links
}
