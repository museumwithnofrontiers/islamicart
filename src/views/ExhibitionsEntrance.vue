<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { I18nTextInline, useI18n, useSiteConfig } from '@museumwnf/viewer-core'
import { SocialLinks, chromeSource } from '@museumwnf/viewer-layout'
import { exhibitionsTree, minisiteHref } from '../composables/exhibitions.js'
import { useData } from '../composables/data.js'

// Legacy's Virtual Exhibitions landing page (exhibitions/ISL/index.php), a
// page apart from Discover Islamic Art's others, with a frame of its own: a
// 763px column on a grey-brown ground, its own header (the logo of the page
// language, the portal links and the language), its picture with the title,
// the exhibitions in two columns, the European Union's logos and line, then
// its menu and its footer. The shell leaves this route bare. Every size,
// colour and position is legacy's (_styles.css, _mainpage.css, and
// _styles_ar.css for Arabic); its pictures are under
// theme/assets/legacy/exhibitions/.
//
// Each exhibition leads to its own website (its mini-site). The first ten
// fill the first column, the rest the second, as legacy split them; hovering
// one shows its picture, kept two seconds after the pointer leaves.

const { mdStrip, tr } = useData()
const { t, locale } = useI18n()
const config = useSiteConfig()

const standalone = computed(() => config.standalone ?? {})
const nav = computed(() => config.navigation ?? {})
const picture = (key) => chromeSource(config.chrome, key)
const frame = (name) => picture(`legacy/exhibitions/${name}`)

const arabic = computed(() => locale.value === 'ar')
const logo = computed(() => frame(`logo_${locale.value}.gif`) ?? frame('logo_en.gif'))
const headerLinks = computed(() => standalone.value.headerLinks ?? [])
const languages = computed(() => nav.value.languages ?? [])
const year = new Date().getFullYear()

// The language, as the header's select sets it: viewer-core puts it in the address.
const language = computed({
  get: () => locale.value,
  set: (code) => { locale.value = code },
})

// The exhibition's legacy number names its picture (images/item_<n>.jpg).
const legacyNumber = (exhibition) => /^mwnf3:exhibitions:(\d+)$/.exec(exhibition.backward_compatibility ?? '')?.[1]

const exhibitions = computed(() => {
  const root = exhibitionsTree.root.value
  if (!root) return []
  return exhibitionsTree.children(root.id).map((exhibition) => {
    const number = legacyNumber(exhibition)
    return {
      id: exhibition.id,
      title: mdStrip(tr('collections', exhibition.id).title ?? exhibition.internal_name),
      href: minisiteHref(exhibition.id, locale.value) ?? undefined,
      picture: number ? frame(`item_${number}.jpg`) : null,
    }
  })
})
const columns = computed(() => [exhibitions.value.slice(0, 10), exhibitions.value.slice(10)])

const shown = ref(null)
let hideTimer = null
function show(exhibition) {
  window.clearTimeout(hideTimer)
  shown.value = exhibition.picture
}
function hide() {
  window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => { shown.value = null }, 2000)
}
onBeforeUnmount(() => window.clearTimeout(hideTimer))

// The menu under the picture, in legacy's order: no Islamic Dynasties.
const MENU = [
  'islamicart.nav.permanentCollection',
  'islamicart.nav.database',
  'islamicart.nav.exhibitions',
  'islamicart.nav.artisticIntroduction',
  'islamicart.nav.timeline',
  'islamicart.nav.partners',
  'islamicart.nav.myCollection',
]
const menu = computed(() => MENU.map((label) => (nav.value.links ?? []).find((link) => link.label === label)).filter(Boolean))

// Legacy's Language Policy link prints no text (its tag is never closed): not drawn.
const footerLinks = computed(() => (nav.value.footerLinks ?? []).filter((link) => link.label !== 'islamicart.footer.languagePolicy'))

// The words of the links above, each spelled out (the i18n check reads only
// written names); the links themselves are the config's.
const words = computed(() => ({
  'islamicart.nav.portal': t('islamicart.nav.portal'),
  'islamicart.nav.home': t('islamicart.nav.home'),
  'islamicart.nav.permanentCollection': t('islamicart.nav.permanentCollection'),
  'islamicart.nav.database': t('islamicart.nav.database'),
  'islamicart.nav.exhibitions': t('islamicart.nav.exhibitions'),
  'islamicart.nav.artisticIntroduction': t('islamicart.nav.artisticIntroduction'),
  'islamicart.nav.timeline': t('islamicart.nav.timeline'),
  'islamicart.nav.partners': t('islamicart.nav.partners'),
  'islamicart.nav.myCollection': t('islamicart.nav.myCollection'),
  'islamicart.footer.aboutMwnf': t('islamicart.footer.aboutMwnf'),
  'islamicart.footer.contact': t('islamicart.footer.contact'),
  'islamicart.footer.legalNotice': t('islamicart.footer.legalNotice'),
  'islamicart.footer.credits': t('islamicart.footer.credits'),
  'islamicart.footer.cookies': t('islamicart.footer.cookies'),
}))
</script>

<template>
  <div class="exh-ground" :class="{ 'exh-ground--ar': arabic }">
    <div class="exh-column">
      <div class="exh-edge exh-edge--left" :style="{ backgroundImage: `url(${frame('bg_fading_left.gif')})` }" />
      <div class="exh-page">
        <header class="exh-header" :style="{ backgroundImage: `url(${frame('bg_picture_1.jpg')})` }">
          <div class="exh-header__logo">
            <a :href="standalone.logo?.href"><img v-if="logo" :src="logo" :alt="t('islamicart.identity.title')" height="60" /></a>
          </div>
          <div class="exh-header__nav">
            <div>
              <template v-for="(link, i) in headerLinks" :key="link.label">
                <template v-if="i">&nbsp;|&nbsp;</template>
                <RouterLink v-if="link.to" :to="link.to" class="exh-header__link">{{ words[link.label] }}</RouterLink>
                <a v-else :href="link.href" class="exh-header__link">{{ words[link.label] }}</a>
              </template>
            </div>
            <div v-if="languages.length > 1">
              <select v-model="language" class="exh-header__language" :aria-label="t('layout.language.label')">
                <option v-for="option in languages" :key="option.code" :value="option.code">{{ option.label }}</option>
              </select>
            </div>
          </div>
        </header>

        <main id="mwnf-content" class="exh-home">
          <div class="exh-block exh-block--1" :style="{ backgroundImage: `url(${frame('bg_picture_2.jpg')})` }" />
          <div class="exh-block exh-block--2" :style="{ backgroundImage: `url(${frame('bg_picture_3.jpg')})` }" />
          <div class="exh-block exh-block--3" :style="{ backgroundImage: `url(${frame('bg_picture_4.jpg')})` }" />

          <h1 class="exh-title"><span class="exh-title__high">{{ t('islamicart.exhibitions.title') }}</span><br />{{ t('islamicart.exhibitions.subtitle') }}</h1>

          <div class="exh-item"><img v-if="shown" :src="shown" width="125" height="125" alt="" /></div>

          <h2 class="exh-menu-title">{{ t('islamicart.exhibitions.welcome') }}</h2>

          <ul v-for="(column, c) in columns" :key="c" class="exh-menu" :class="`exh-menu--${c + 1}`">
            <li v-for="exhibition in column" :key="exhibition.id">
              &gt; <a :href="exhibition.href" @mouseenter="show(exhibition)" @focus="show(exhibition)" @mouseleave="hide" @blur="hide">{{ exhibition.title }}</a>
            </li>
          </ul>

          <div class="exh-partners">
            <RouterLink :to="{ name: 'sponsors' }"><img :src="frame('supportThumb1.jpg')" :alt="t('islamicart.sponsors.supportHead')" /></RouterLink>
            <br />
            <div class="exh-partners__social"><SocialLinks :links="nav.socialLinks ?? []" /></div>
            <I18nTextInline keypath="islamicart.exhibitions.europeanUnion" />
          </div>
        </main>

        <nav class="exh-menu-bar" :aria-label="t('layout.nav.label')">
          <ul>
            <template v-for="(link, i) in menu" :key="link.label">
              <template v-if="i">|</template>
              <li>
                <RouterLink v-if="link.to" :to="link.to">{{ words[link.label] }}</RouterLink>
                <a v-else :href="link.href">{{ words[link.label] }}</a>
              </li>
            </template>
          </ul>
        </nav>
        <div class="exh-strip" />
        <footer class="exh-footer">
          <template v-for="link in footerLinks" :key="link.label">
            <a :href="link.href">{{ words[link.label] }}</a>&nbsp;|&nbsp;
          </template>{{ t('islamicart.footer.copyright') }} {{ year }}
        </footer>
      </div>
      <div class="exh-edge exh-edge--right" :style="{ backgroundImage: `url(${frame('bg_fading_right.gif')})` }" />
    </div>
  </div>
</template>

<style scoped>
/* Legacy's reset and its Verdana, white on a grey-brown ground. */
.exh-ground {
  min-height: 100vh;
  background-color: #91877f;
  font: normal 12px/14px Verdana, Arial, Helvetica, sans-serif;
  color: #fff;
}

.exh-ground :where(h1, h2, ul, li, p) {
  margin: 0;
  padding: 0;
  font-weight: normal;
}

.exh-ground a {
  color: inherit;
  text-decoration: none;
}

.exh-ground a:hover {
  text-decoration: underline;
}

.exh-column {
  display: flex;
  justify-content: center;
}

.exh-edge {
  flex: 0 0 5px;
  background-repeat: repeat-y;
}

.exh-page {
  flex: 0 1 763px;
  min-width: 0;
}

/* The header (#header): its picture, the logo on the left, the links and
   the language on the right. */
.exh-header {
  position: relative;
  height: 71px;
  background-color: #000;
}

.exh-header__logo {
  position: absolute;
  top: 0;
  left: 0;
}

.exh-header__logo img {
  display: block;
}

.exh-header__nav {
  position: absolute;
  top: 0;
  right: 13px;
  padding-top: 13px;
  text-align: right;
}

.exh-header__link,
.exh-header__nav {
  font: normal 11px Verdana, Arial, Helvetica, sans-serif;
  color: #fff;
}

.exh-header__language {
  margin-top: 8px;
  padding: 1px;
  border: none;
  font: normal 11px Verdana, Arial, Helvetica, sans-serif;
  color: #000;
  background-color: #eee;
}

/* The picture (#homePage) and what stands on it. */
.exh-home {
  position: relative;
  height: 647px;
}

.exh-block {
  position: absolute;
  left: 0;
  width: 100%;
}

.exh-block--1 { top: 0; height: 300px; background-color: #483a33; }
.exh-block--2 { top: 285px; height: 241px; background-color: #392e28; }
.exh-block--3 { top: 526px; height: 121px; background-color: #483a33; }

.exh-title {
  position: absolute;
  top: 180px;
  left: 40px;
  font: normal 28px/32px Georgia, 'Times New Roman', Times, serif;
  color: #fdb303;
}

.exh-title__high {
  font: normal 49px Georgia, 'Times New Roman', Times, serif;
}

.exh-item {
  position: absolute;
  top: 346px;
  left: 51px;
  width: 125px;
  height: 125px;
}

.exh-item img {
  display: block;
}

.exh-menu-title {
  position: absolute;
  top: 295px;
  left: 200px;
  font: bold 13px Georgia, 'Times New Roman', Times, serif;
  color: #fdb303;
}

.exh-menu {
  position: absolute;
  top: 320px;
  list-style: none;
  font: normal 13px/19px Georgia, 'Times New Roman', Times, serif;
}

.exh-menu--1 { left: 200px; width: 250px; }
.exh-menu--2 { left: 460px; width: 290px; }

.exh-menu a:hover {
  color: #fdb303;
}

.exh-partners {
  position: absolute;
  top: 550px;
  left: 45px;
  width: 700px;
  font: normal 9px/12px Verdana, Arial, Helvetica, sans-serif;
}

.exh-partners img {
  margin: 0 5px 10px 0;
  vertical-align: middle;
}

.exh-partners__social {
  float: right;
  width: 200px;
  padding: 0 20px 0 15px;
  text-align: right;
  font-size: 20px;
}

/* Legacy's icons are white (.svg-inline--fa). */
.exh-partners__social {
  --mwnf-footer-social-color: #fff;
}

/* The menu (#btmMenu), the line under it and the footer. */
.exh-menu-bar {
  padding: 5px 0 6px;
  background-color: #1f282f;
  text-align: center;
  font: normal 9px Verdana, Arial, Helvetica, sans-serif;
  color: #999;
}

.exh-menu-bar ul {
  list-style: none;
}

.exh-menu-bar li {
  display: inline;
  padding: 0 7px 0 9px;
}

.exh-menu-bar a {
  font-size: 10px;
  color: #999;
}

.exh-menu-bar a:hover {
  text-decoration: none;
}

.exh-strip {
  height: 1px;
  background-color: #556775;
}

.exh-footer {
  padding: 5px 0 6px;
  background-color: #1f282f;
  text-align: center;
  font: normal 9px Verdana, Arial, Helvetica, sans-serif;
  color: #999;
}

/* Arabic (_styles_ar.css): the header mirrored, the title and the columns
   placed for a right-to-left reading, in Arabic faces. */
.exh-ground--ar .exh-page {
  direction: rtl;
  text-align: right;
}

.exh-ground--ar,
.exh-ground--ar .exh-header__link,
.exh-ground--ar .exh-header__nav,
.exh-ground--ar .exh-footer {
  font-family: 'Simplified Arabic', 'Arabic Transparent', 'Traditional Arabic', Arial, sans-serif;
}

.exh-ground--ar .exh-footer {
  font-size: 12px;
}

.exh-ground--ar .exh-header__logo { left: auto; right: 0; }
.exh-ground--ar .exh-header__nav { right: auto; left: 10px; text-align: left; }

.exh-ground--ar .exh-title {
  top: 170px;
  left: 20px;
  width: 700px;
  font: bold 30px 'Simplified Arabic', 'Arabic Transparent', 'Traditional Arabic', Arial, sans-serif;
}

.exh-ground--ar .exh-title__high {
  font: bold 55px 'Simplified Arabic', 'Arabic Transparent', 'Traditional Arabic', Arial, sans-serif;
}

.exh-ground--ar .exh-item { left: 587px; }

.exh-ground--ar .exh-menu-title {
  top: 300px;
  left: 55px;
  width: 500px;
  font: normal 14px 'Simplified Arabic', 'Arabic Transparent', 'Traditional Arabic', Arial, sans-serif;
}

.exh-ground--ar .exh-menu {
  top: 330px;
  font: normal 14px/19px 'Simplified Arabic', 'Arabic Transparent', 'Traditional Arabic', Arial, sans-serif;
}

.exh-ground--ar .exh-menu--1 { left: 305px; }
.exh-ground--ar .exh-menu--2 { left: 20px; }

.exh-ground--ar .exh-partners {
  left: 15px;
  font: normal 12px 'Simplified Arabic', 'Arabic Transparent', 'Traditional Arabic', Arial, sans-serif;
}

.exh-ground--ar .exh-partners__social { float: left; }

/* Narrower than the column: the picture's places no longer fit, so what
   stands on it follows one under the other on its first picture. */
@media (max-width: 772px) {
  .exh-home {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: auto;
    padding: 24px 16px;
    background-color: #392e28;
  }

  .exh-block,
  .exh-item {
    display: none;
  }

  .exh-title,
  .exh-menu-title,
  .exh-menu,
  .exh-partners,
  .exh-ground--ar .exh-title,
  .exh-ground--ar .exh-menu-title,
  .exh-ground--ar .exh-menu,
  .exh-ground--ar .exh-partners {
    position: static;
    width: auto;
  }

  .exh-title__high {
    font-size: 36px;
  }

  .exh-header__nav {
    right: 8px;
  }

  .exh-header__logo img {
    height: 44px;
    width: auto;
  }
}
</style>
