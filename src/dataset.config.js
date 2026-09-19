import { languageLabels, offeredLanguages, sectionMeta, useDataPackage } from '@museumwnf/viewer-core'
import SiteShell from './SiteShell.vue'

// The whole declaration of this website. Before it mounts, the website reads
// nothing from its package but the manifest: the languages it offers, their
// labels and its name come from `manifest.site`, and every record is loaded
// by the route that reads it.

const { manifest } = useDataPackage()

// The languages the package declares for this site, kept where the item
// translations actually carry them. An item sheet may offer more — whatever
// languages the record itself carries — from its own switcher, without
// touching the site language.
const languages = offeredLanguages()

// A route says what section it is (kebab-case, matching the nav entry in
// SiteShell.vue), and the shell reads it through viewer-core's `useSection()`
// for the active menu entry — never derived from the path. This site has no
// chrome entities every page loads regardless of section, so `sectionMeta()`
// is called with none.
const meta = sectionMeta()

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@museumwnf/islamicart-data',

  siteName: manifest.site?.names?.en ?? 'Islamic Art',

  // The absolute origin this build is deployed at, base path included, no
  // trailing slash — read by `sourceUrl()` for the citation permalink under
  // a sheet and by the footer's terms link. This is the GitHub Pages address
  // (org.github.io/<repo>) until the domain is decided; the base path here
  // is the same one `vite.config.js`'s `base` resolves to for this repo
  // (`BASE_PATH`, set by the deploy workflow from the repo name), so the two
  // must be kept in step if the site ever moves off GitHub Pages.
  site: {
    origin: 'https://museumwithnofrontiers.github.io/islamicart',
  },

  // All pages are website-specific views (below) — no generic entity pages.
  features: {
    entities: [],
  },

  languages,

  shell: SiteShell,

  // viewer-layout's `SiteShell` (mounted in SiteShell.vue) reads this to
  // build the menu itself: each label is an entry name it resolves through
  // `t()`, and the entry whose `section` matches the route's `meta.section`
  // (via `useSection()`) is marked active. The footer line stays a prop on
  // SiteShell.vue directly — `config.navigation` has no field for it.
  navigation: {
    languages: languageLabels(languages),
    links: [
      { section: 'home', label: 'core.nav.home', to: { name: 'home' } },
      { section: 'permanent-collection', label: 'islamicart.nav.permanentCollection', to: { name: 'permanent-collection' } },
      { section: 'database', label: 'islamicart.nav.database', to: { name: 'database' } },
      { section: 'timeline', label: 'islamicart.nav.timeline', to: { name: 'timeline' } },
      { section: 'partners', label: 'islamicart.nav.partners', to: { name: 'partners' } },
      { section: 'artistic-introduction', label: 'islamicart.nav.artisticIntroduction', to: { name: 'artistic-introduction' } },
      { section: 'exhibitions', label: 'islamicart.nav.exhibitions', to: { name: 'exhibitions' } },
    ],
  },

  // The route map: every route named, kebab-case sections, the package id in
  // the path, and the page and every filter in the query. Each route declares
  // the entities its view reads, so the router loads them before the view is
  // created and no page renders against records that are not there yet.
  //
  // The 'home' name replaces viewer-core's generic home route.
  extraViews: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/Home.vue'),
      meta: meta('home', 'items'),
    },
    {
      path: '/permanent-collection',
      name: 'permanent-collection',
      component: () => import('./views/PcEntrance.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'dynasties', 'partners'),
    },
    {
      path: '/permanent-collection/results',
      name: 'permanent-collection-results',
      component: () => import('./views/PcList.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'dynasties', 'partners'),
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('./views/Database.vue'),
      meta: meta('database'),
    },
    {
      path: '/database/results',
      name: 'database-results',
      component: () => import('./views/DatabaseResults.vue'),
      meta: meta('database', 'items', 'countries', 'dynasties', 'partners'),
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineEntrance.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events', 'countries'),
    },
    {
      path: '/timeline/results',
      name: 'timeline-results',
      // 'items' feeds the "See gallery" cross-link's own count
      // (composables/timeline.js), not the events themselves.
      component: () => import('./views/TimelineResults.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events', 'countries', 'items'),
    },
    {
      path: '/timeline/gallery',
      name: 'timeline-gallery',
      component: () => import('./views/TimelineGallery.vue'),
      meta: meta('timeline', 'items', 'countries', 'dynasties', 'partners'),
    },
    {
      path: '/partners',
      name: 'partners',
      component: () => import('./views/PartnersEntrance.vue'),
      meta: meta('partners', 'items', 'partners', 'countries'),
    },
    {
      path: '/partners/results',
      name: 'partners-results',
      component: () => import('./views/PartnersResults.vue'),
      meta: meta('partners', 'partners', 'countries'),
    },
    {
      path: '/partner/:id',
      name: 'partner',
      component: () => import('./views/PartnerDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      meta: meta('partners', 'partners', 'items', 'countries'),
    },
    {
      path: '/artistic-introduction',
      name: 'artistic-introduction',
      component: () => import('./views/ArtIntroEntrance.vue'),
      meta: meta('artistic-introduction', 'collections'),
    },
    {
      path: '/artistic-introduction/:themeId',
      name: 'artistic-introduction-theme',
      component: () => import('./views/ArtIntroTheme.vue'),
      meta: meta('artistic-introduction', 'collections', 'items', 'partners', 'dynasties'),
    },
    {
      path: '/exhibitions',
      name: 'exhibitions',
      component: () => import('./views/ExhibitionsEntrance.vue'),
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId',
      name: 'exhibition',
      component: () => import('./views/ExhibitionSplash.vue'),
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      name: 'exhibition-introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
      meta: meta('exhibitions', 'collections', 'items', 'partners', 'dynasties'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      name: 'exhibition-theme',
      component: () => import('./views/ExhibitionTheme.vue'),
      meta: meta('exhibitions', 'collections', 'items', 'partners', 'dynasties'),
    },
    {
      // The item sheet is reached from both the curated Permanent Collection
      // and the free-text Database search, but it renders the same record
      // either way: it belongs to 'database', the section that owns the
      // general-purpose search this page is a result of (as in carpets).
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      meta: meta('database', 'items', 'dynasties', 'collections', 'partners', 'countries'),
    },
  ],

  // This website has never been published under any other URL shape: its
  // routes are the canonical ones, so there is nothing to redirect from.
  legacyRoutes: [],
}

// ── Project knowledge (#1727 phase 4) ───────────────────────────────────────
//
// The data package's manifest (`manifest.projects`) carries each project's
// own name and links; which of them this website searches by default, offers
// through the "Explore" opt-in, and groups under each partner-entrance panel
// are this site's own editorial choices, not modelled in the data package
// (#1727 decision 5) — kept here, next to the rest of this website's config,
// keyed by the project UUIDs this data package exports (confirmed with
// `npm pack @museumwnf/islamicart-data`, manifest.json's `projects`).

export const PROJECTS = {
  // 'Discover Islamic Art' — legacy database.php's own project, always
  // searched and browsed.
  discover: '61c122ac-ea86-5462-8bab-6b86138c49b2',
  // 'Explore Islamic Art Collections' — legacy's "Include Explore Islamic
  // Art Collections" checkbox, opt-in.
  explore: '928f5e0d-53e3-5f53-b9c2-5af389c30dd4',
}

export const search = {
  defaultProjects: [PROJECTS.discover],
  optionalProjects: [PROJECTS.explore],
}

// The partner entrance's panels (PartnersEntrance.vue): legacy's two
// separate pages (`pm_partner_list.php`, `pm_partner_list_eiac.php`), one
// per project, each offering the partner kinds legacy offered there —
// Explore never had an institutions page.
export const partnerEntrance = [
  {
    project: PROJECTS.discover,
    intro: 'islamicart.partner.introDiscover',
    buttons: [
      { kind: 'museum', action: 'islamicart.action.browseMuseums' },
      { kind: 'institution', action: 'islamicart.action.browseInstitutions' },
    ],
  },
  {
    project: PROJECTS.explore,
    intro: 'islamicart.partner.introExplore',
    buttons: [
      { kind: 'museum', action: 'islamicart.action.browseMuseums' },
    ],
  },
]
