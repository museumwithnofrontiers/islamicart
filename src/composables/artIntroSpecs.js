import { renderInline } from '@museumwnf/viewer-core'
import { artIntroRoot } from './artIntro.js'
import { useData } from './data.js'

// The Artistic Introduction theme's `EssayView` spec — mirrors
// `exhibitionSpecs.js`'s `exhibitionThemeSpec` (see there for the
// panel/variant shape this follows): the same narrative-over-item-panel
// page, over `composables/artIntro.js`'s one global tree instead of a
// per-exhibition one, with `navigation: 'siblings'` (a fixed tab strip
// over a theme's own pages, not previous/next across the whole section —
// legacy never walked from one theme into the next here) and no
// breadcrumb (the ancestors above a theme — the tree's marker, the
// project — carry no text of their own to show).

const { dynastyLabel, partnerLabel, tr } = useData()

// The importer synthesizes a placeholder title ("Theme 5", "Artintro Page
// 17") when the legacy source has no page_title/theme_title for a given
// language; `EssayView` treats a title matching this as missing and falls
// back to the English one itself — this site does the same thing by hand
// below, for the *theme's* title (see `heading`).
export const ART_INTRO_PLACEHOLDER_TITLE = /^(Artintro )?(Theme|Page) \d+$/

function itemEntry(node, itemId) {
  return node?.items?.find((entry) => entry.id === itemId) ?? null
}

function localCaption(entry, language) {
  return entry?.caption?.[language] ?? entry?.caption?.en ?? {}
}

// The four unlabeled meta lines legacy showed beside an item's picture —
// dynasty, date, location, holding museum.
function itemMetaValues(item, node, ctx) {
  const caption = localCaption(itemEntry(node, item.id), ctx.language)
  const own = ctx.tr('items', item.id)
  return [
    caption.dynasty ?? (item.dynasty_ids?.[0] ? dynastyLabel(item.dynasty_ids[0]) : ''),
    caption.date ?? own.dates,
    caption.location ?? own.location,
    caption.museum ?? (item.partner_id ? partnerLabel(item.partner_id) : ''),
  ].filter(Boolean)
}

function itemMetaFields(item, node, ctx) {
  return itemMetaValues(item, node, ctx).map((value) => ({ label: '', value }))
}

// A "detail" close-up's own caption, read only from the variant's own
// caption — unlike the item's main view, a detail never falls back to the
// item's generic translation.
function detailMetaFields(caption) {
  return [caption.dynasty, caption.date, caption.location, caption.museum]
    .filter(Boolean)
    .map((value) => ({ label: '', value }))
}

// A page's own theme: walk up from `node` until the parent is the section
// root — one hop for a page, zero for a theme with no pages of its own
// (`activeId` in `ArtIntroTheme.vue` falls back to the theme itself then).
// Robust to how many ancestors (the tree's root, its marker, the project)
// sit above the theme, unlike counting `tree.parents(node.id).length`.
function themeOf(tree, node) {
  const rootId = artIntroRoot.value?.id
  let current = node
  while (current && current.parent_id !== rootId) {
    current = tree.byId.value.get(current.parent_id)
  }
  return current ?? node
}

function resolveThemeTitle(theme, ctx) {
  if (!theme) return ''
  const isPlaceholder = (value) => Boolean(value) && ART_INTRO_PLACEHOLDER_TITLE.test(value)
  const own = ctx.tr('collections', theme.id)
  if (own.title && !isPlaceholder(own.title)) return own.title
  const en = tr('collections', theme.id)?.title
  if (en && !isPlaceholder(en)) return en
  return theme.internal_name ?? theme.id
}

// A page's own route: `/artistic-introduction/:themeId` plus `?tab` for a
// page past the theme's first. `navigation: 'siblings'` and the tab strip
// both only ever hand this a page within the *same* theme, so the theme is
// always the node's immediate parent, regardless of how many ancestors sit
// above that (see `themeOf`'s own note).
export function artIntroThemeRoute(tree) {
  return (node) => {
    const theme = tree.parents(node.id).at(-1)
    if (!theme) return { name: 'artistic-introduction' }
    const siblings = tree.children(theme.id)
    const tab = siblings.findIndex((sibling) => sibling.id === node.id)
    return { name: 'artistic-introduction-theme', params: { themeId: theme.id }, query: tab > 0 ? { tab } : {} }
  }
}

export function artIntroThemeSpec(tree) {
  return {
    tree,
    entity: 'items',
    route: artIntroThemeRoute(tree),
    // The heading is always the *theme's* own title, not the active
    // page's — legacy's tab strip switches the narrative and the panel,
    // never the page heading above them.
    heading: (ctx) => renderInline(String(resolveThemeTitle(themeOf(tree, ctx.node), ctx))),
    quote: 'quote',
    body: 'description',
    items: {
      of: (node) => (node.items ?? []).map((entry) => entry.id),
      caption: (item, node, ctx) => {
        const caption = localCaption(itemEntry(node, item.id), ctx.language)
        const override = {}
        if (caption.name) override.name = renderInline(String(caption.name))
        return override
      },
      route: (item) => ({ name: 'item', params: { id: item.id } }),
    },
    panel: {
      // Each "detail" close-up carries its own image *and* caption (title,
      // justification, fields), swapping together when picked — the same
      // shape as `exhibitionThemeSpec`'s; `fields` falls back to the
      // fields below when a variant carries none of its own (the item's
      // own main view, `EssayView`'s auto-injected primary variant).
      variants: (item, ctx) => {
        const entry = itemEntry(ctx.node, item.id)
        return (entry?.details ?? []).map((variant) => {
          const caption = localCaption(variant, ctx.language)
          const title = caption.detail_name ?? caption.name ?? ''
          return {
            image: variant.image_url,
            alt: renderInline(String(title)),
            caption: {
              title: title ? renderInline(String(title)) : '',
              justification: caption.justification ?? '',
              fields: detailMetaFields(caption),
            },
          }
        })
      },
      fields: (item, node, ctx) => itemMetaFields(item, node, ctx),
    },
    navigation: 'siblings',
    tabs: true,
    numbering: false,
  }
}
