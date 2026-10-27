import { languageLabels, mwnfLinks, offeredLanguages, sectionMeta, useDataPackage } from '@museumwnf/viewer-core'
import { mwnfSocialLinks } from '@museumwnf/viewer-layout'
import { StandaloneShell } from '@museumwnf/viewer-layout/standalone'
import homeItems from './home-items.json'

// The chrome is legacy's own pictures, kept in this repository under
// theme/assets/ (decision D7; theme/assets/legacy/SOURCES.json names where
// each one was taken from), handed to the layout as one map that Vite builds
// and fingerprints. The config below names a file by its path under
// theme/assets/.
const chrome = import.meta.glob('../theme/assets/**/*.{jpg,jpeg,png,gif,svg}', {
  eager: true, query: '?url', import: 'default',
})

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

// A route says what section it is (kebab-case, matching the nav entry
// below), and the shell reads it through viewer-core's `useSection()`
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

  // viewer-layout's standalone family shell: legacy Discover Islamic Art's
  // chrome (index.php, includes/header_bottom.php), read from `standalone`
  // below. Every text in this file is an entry of locales/, extracted from
  // legacy by inventory-app's `scripts/site-i18n` (`extract:standalone`).
  shell: StandaloneShell,

  chrome,

  standalone: {
    // The logo links to the MWNF portal, as legacy's did. Legacy served one
    // file per language, all four byte for byte the same.
    logo: {
      src: 'legacy/logo_isl_en.png',
      alt: 'islamicart.identity.title',
      href: mwnfLinks.portal,
      print: { en: 'legacy/logo_print.gif', fr: 'legacy/logo_print_fr.gif' },
    },
    heading: 'islamicart.identity.heading',
    headerLinks: [
      { label: 'islamicart.nav.portal', href: mwnfLinks.portal },
      { label: 'islamicart.nav.home', to: { name: 'home' }, on: 'inner' },
    ],
    banner: { home: 'legacy/banner.jpg', inner: 'legacy/banner_inside.jpg' },
    copyright: 'islamicart.footer.copyright',
    // "Discover Islamic Art was set up with the support of:", the European
    // Union (its logo opens legacy's explanation) and the Gulbenkian
    // Foundation; "Explore Islamic Art Collections — Arabic version", Barakat.
    sponsors: {
      on: 'home',
      columns: [
        { width: 3, lead: 'islamicart.sponsors.supportHead', text: 'islamicart.sponsors.supportText' },
        {
          width: 4,
          logos: [
            { src: 'legacy/euromed.jpg', alt: 'islamicart.sponsors.supportHead', note: 'islamicart.sponsors.europeanUnion' },
            { src: 'legacy/Calouste.png', href: 'http://www.gulbenkian.pt' },
          ],
        },
        { width: 3, lead: 'islamicart.sponsors.exploreHead', text: 'islamicart.sponsors.exploreText', break: true },
        { width: 2, logos: [{ src: 'legacy/barakat.png', href: 'https://barakat.org/' }] },
      ],
    },
    // The home page's two columns (diaTemplates/leftLink.php, randomText.php):
    // the side links, and the item of the day from legacy's own list.
    home: {
      links: [
        { label: 'islamicart.home.recommendedLinks', to: { name: 'recommended-links' } },
        { label: 'islamicart.home.credits', href: mwnfLinks.credits },
        { label: 'islamicart.home.missionStatement', to: { name: 'mission-statement' } },
        {
          label: 'islamicart.home.explore',
          prefix: 'islamicart.home.visit',
          italic: true,
          title: 'islamicart.home.exploreTooltip',
          // Legacy's pm_partner_list_eiac.php?type=museum: the museums of
          // PROJECTS.explore (declared below, after this object is built).
          to: { name: 'partners-results', query: { type: 'museum', project: '928f5e0d-53e3-5f53-b9c2-5af389c30dd4' } },
          gap: true,
        },
      ],
      highlight: {
        list: homeItems,
        heading: 'islamicart.home.highlight',
        alsoKnownAs: 'islamicart.home.alsoKnownAs',
        action: 'islamicart.home.viewDescription',
        route: 'item',
        // Legacy's own picture of the day (libs/class.homepage_item.inc.php):
        // random_image/DIA_new/1.jpg to 171.jpg, a cycle of its own by the day
        // of the year, kept under theme/assets/legacy/.
        pictures: Array.from({ length: 171 }, (_, i) => `legacy/random_image/DIA_new/${i + 1}.jpg`),
      },
    },
  },

  // The menu, in legacy's order (includes/header_bottom.php): each label an
  // entry name, the entry whose `section` matches the route's `meta.section`
  // marked active. My Collection leaves for the portal, as legacy's did. It
  // sits under the home page's picture, and above every other page's band.
  navigation: {
    languages: languageLabels(languages),
    links: [
      { section: 'permanent-collection', label: 'islamicart.nav.permanentCollection', to: { name: 'permanent-collection' } },
      { section: 'database', label: 'islamicart.nav.database', to: { name: 'database' } },
      { section: 'exhibitions', label: 'islamicart.nav.exhibitions', to: { name: 'exhibitions' } },
      { section: 'artistic-introduction', label: 'islamicart.nav.artisticIntroduction', to: { name: 'artistic-introduction' } },
      { section: 'partners', label: 'islamicart.nav.partners', to: { name: 'partners' } },
      { section: 'timeline', label: 'islamicart.nav.timeline', to: { name: 'timeline' } },
      { section: 'dynasties', label: 'islamicart.nav.dynasties', to: { name: 'dynasties' } },
      { label: 'islamicart.nav.myCollection', href: mwnfLinks.myCollection, external: true },
    ],
    placement: ({ section }) => (section === 'home' ? 'after-banner' : 'before-banner'),
    // Legacy's footer icons: YouTube, X, Facebook, Instagram, Weibo, LinkedIn.
    socialLinks: mwnfSocialLinks,
    // The footer (includes/footer.php), in its order; the copyright line and
    // the year follow (`standalone.copyright`).
    footerLinks: [
      { label: 'islamicart.footer.aboutMwnf', href: mwnfLinks.about },
      { label: 'islamicart.footer.contact', href: mwnfLinks.contact },
      { label: 'islamicart.footer.legalNotice', href: mwnfLinks.legalNotice },
      { label: 'islamicart.footer.credits', href: mwnfLinks.credits },
      { label: 'islamicart.footer.languagePolicy', href: 'https://www.museumwnf.org/about/language-policy' },
      { label: 'islamicart.footer.cookies', href: mwnfLinks.cookies, external: true },
    ],
    // The title on each section's band (legacy's SectionTitle() per page).
    sectionTitles: {
      'permanent-collection': 'islamicart.section.permanentCollection',
      database: 'islamicart.section.database',
      exhibitions: 'islamicart.nav.exhibitions',
      'artistic-introduction': 'islamicart.nav.artisticIntroduction',
      partners: 'islamicart.section.partners',
      timeline: 'islamicart.nav.timeline',
      dynasties: 'islamicart.dynasties.title',
      'mission-statement': 'islamicart.missionStatement.title',
      'recommended-links': 'islamicart.home.recommendedLinks',
    },
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
      component: () => import('@museumwnf/viewer-layout/standalone').then((family) => family.StandaloneHome),
      meta: meta('home', 'items', 'countries'),
    },
    {
      // isl_missionstatement.php: legacy's text, then "→ Discover Islamic
      // Art" to the Permanent Collection, and Print.
      path: '/mission-statement',
      name: 'mission-statement',
      component: () => import('./views/MissionStatement.vue'),
      meta: meta('mission-statement'),
    },
    {
      // Islamic Dynasties (legacy's /dynasties/ client): the start page with
      // the picker, a dynasty's profile, and its objects or monuments.
      path: '/dynasties',
      name: 'dynasties',
      component: () => import('./views/DynastiesEntrance.vue'),
      meta: meta('dynasties', 'dynasties'),
    },
    {
      path: '/dynasties/:id',
      name: 'dynasty',
      component: () => import('./views/DynastyProfile.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      meta: meta('dynasties', 'dynasties', 'items'),
    },
    {
      path: '/dynasties/:id/:kind(objects|monuments)',
      name: 'dynasty-related',
      component: () => import('./views/DynastyRelated.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id), kind: route.params.kind }),
      meta: meta('dynasties', 'dynasties', 'items', 'countries', 'partners'),
    },
    {
      // recommendedlinks.php: its groups of links, in English as legacy
      // printed them in every language.
      path: '/recommended-links',
      name: 'recommended-links',
      component: () => import('@museumwnf/viewer-layout/standalone').then((family) => family.StandaloneTextPage),
      props: { body: 'islamicart.recommendedLinks.body' },
      meta: meta('recommended-links'),
    },
    {
      path: '/permanent-collection',
      name: 'permanent-collection',
      component: () => import('./views/PermanentCollectionSearch.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'dynasties', 'partners'),
    },
    {
      path: '/permanent-collection/results',
      name: 'permanent-collection-results',
      component: () => import('./views/PermanentCollectionResults.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'dynasties', 'partners'),
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('./views/DatabaseSearch.vue'),
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
    // Each exhibition is a website of its own now (src/minisites.json): the
    // addresses this site gave its pages lead there.
    {
      path: '/exhibitions/:exhibitionId',
      name: 'exhibition',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: true,
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      name: 'exhibition-introduction',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: true,
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      name: 'exhibition-theme',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: true,
      meta: meta('exhibitions', 'collections'),
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

// The partner entrance's two panels (PartnersEntrance.vue) each route to one
// of these — legacy's two separate pages (`pm_partner_list.php`,
// `pm_partner_list_eiac.php`). Every $t()/I18nText entry name in that view
// stays written out at its own call site (viewer-i18n-check reads only
// literal names, never one carried through a config value or a function
// call), so only the routing target — the project UUID — lives here.
