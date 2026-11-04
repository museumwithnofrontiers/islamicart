<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n, useSiteConfig } from '@museumwnf/viewer-core'
import { SocialLinks, chromeSource } from '@museumwnf/viewer-layout'
import './dynasties.css'

// Legacy's Islamic Dynasties client (/dynasties/), a site apart from
// Discover Islamic Art's PHP pages, with a frame of its own: a 1350px page
// on a pale ground, its header (the logo, the title over the middle, the
// portal links and the language), the menu, its band, and a footer of one
// line. Its pages (the start page, a dynasty, its objects or monuments) draw
// in this frame, on routes the site's shell leaves bare. The links, the
// pictures and the words are the site's own (dataset.config.js).
//
// The client's footer has no Language Policy link.

const { t, locale } = useI18n()
const route = useRoute()
const config = useSiteConfig()

const standalone = computed(() => config.standalone ?? {})
const nav = computed(() => config.navigation ?? {})
const picture = (key) => chromeSource(config.chrome, key)

const logo = computed(() => picture(standalone.value.logo?.src))
const banner = computed(() => picture(standalone.value.banner?.inner))
const headerLinks = computed(() => standalone.value.headerLinks ?? [])
const menu = computed(() => nav.value.links ?? [])
const footerLinks = computed(() => (nav.value.footerLinks ?? []).filter((link) => link.label !== 'islamicart.footer.languagePolicy'))
const languages = computed(() => nav.value.languages ?? [])
const year = new Date().getFullYear()

// The words of the links above, each spelled out (the i18n check reads only
// written names); the links themselves are the config's.
const words = computed(() => ({
  'islamicart.nav.portal': t('islamicart.nav.portal'),
  'islamicart.nav.home': t('islamicart.nav.home'),
  'islamicart.nav.permanentCollection': t('islamicart.nav.permanentCollection'),
  'islamicart.nav.database': t('islamicart.nav.database'),
  'islamicart.nav.exhibitions': t('islamicart.nav.exhibitions'),
  'islamicart.nav.artisticIntroduction': t('islamicart.nav.artisticIntroduction'),
  'islamicart.nav.partners': t('islamicart.nav.partners'),
  'islamicart.nav.timeline': t('islamicart.nav.timeline'),
  'islamicart.nav.dynasties': t('islamicart.nav.dynasties'),
  'islamicart.nav.myCollection': t('islamicart.nav.myCollection'),
  'islamicart.footer.aboutMwnf': t('islamicart.footer.aboutMwnf'),
  'islamicart.footer.contact': t('islamicart.footer.contact'),
  'islamicart.footer.legalNotice': t('islamicart.footer.legalNotice'),
  'islamicart.footer.credits': t('islamicart.footer.credits'),
  'islamicart.footer.cookies': t('islamicart.footer.cookies'),
}))

// The language, as the header's select sets it: viewer-core puts it in the address.
const language = computed({
  get: () => locale.value,
  set: (code) => { locale.value = code },
})

// Font Awesome's bars and xmark, the client's menu and close buttons.
const BARS = 'M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z'
const XMARK = 'M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z'

// On a phone the menu opens over the page from its button, and closes on the
// way to another page.
const menuOpen = ref(false)
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <!-- The client kept its frame left to right in every language; only a
       dynasty's own texts run right to left (the pages set that). -->
  <div class="dyn-ground" dir="ltr">
    <div class="dyn-page">
      <header class="dyn-header">
        <div class="dyn-header__logo">
          <a :href="standalone.logo?.href"><img v-if="logo" :src="logo" :alt="t('islamicart.identity.title')" /></a>
        </div>
        <div class="dyn-header__title">
          <RouterLink :to="{ name: 'dynasties' }"><span>{{ t('islamicart.identity.heading') }}</span></RouterLink>
        </div>
        <div class="dyn-header__tools">
          <div class="dyn-header__links">
            <template v-for="(link, i) in headerLinks" :key="link.label">
              <span v-if="i" class="dyn-header__separator">|</span>
              <RouterLink v-if="link.to" :to="link.to">{{ words[link.label] }}</RouterLink>
              <a v-else :href="link.href">{{ words[link.label] }}</a>
            </template>
          </div>
          <div v-if="languages.length > 1" class="dyn-header__language">
            <select v-model="language" :aria-label="t('layout.language.label')">
              <option v-for="option in languages" :key="option.code" :value="option.code">{{ option.label }}</option>
            </select>
          </div>
        </div>
      </header>

      <nav class="dyn-nav" :class="{ 'dyn-nav--open': menuOpen }" :aria-label="t('layout.nav.label')">
        <div class="dyn-nav__icon">
          <button type="button" class="dyn-nav__toggle" :aria-expanded="menuOpen" aria-controls="dyn-menu" @click="menuOpen = !menuOpen">
            <svg class="dyn-icon" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="BARS" /></svg>
            <span class="dyn-sr">{{ t('layout.nav.menu') }}</span>
          </button>
        </div>
        <div class="dyn-nav__backdrop" @click.self="menuOpen = false">
          <div id="dyn-menu" class="dyn-nav__menu">
            <button type="button" class="dyn-nav__close" @click="menuOpen = false">
              <svg class="dyn-icon" viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="XMARK" /></svg>
              <span class="dyn-sr">{{ t('core.action.close') }}</span>
            </button>
            <ul>
              <li v-for="link in menu" :key="link.label">
                <RouterLink v-if="link.to" :to="link.to">{{ words[link.label] }}</RouterLink>
                <a v-else :href="link.href" :target="link.external ? '_blank' : undefined" :rel="link.external ? 'noopener' : undefined">{{ words[link.label] }}</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div class="dyn-band">
        <img v-if="banner" :src="banner" alt="" />
        <div class="dyn-band__overlay">
          <div class="dyn-band__title">{{ t('islamicart.dynasties.title') }}</div>
        </div>
      </div>

      <main id="mwnf-content" class="dyn-main">
        <slot />
      </main>

      <footer class="dyn-footer">
        <div class="dyn-footer__links">
          <template v-for="link in footerLinks" :key="link.label">
            <a :href="link.href" :target="link.external ? '_blank' : undefined" :rel="link.external ? 'noopener' : undefined">{{ words[link.label] }}</a> |
          </template>
          <span>{{ t('islamicart.footer.copyright') }} {{ year }}</span>
        </div>
        <div class="dyn-footer__social">
          <SocialLinks :links="nav.socialLinks ?? []" />
        </div>
      </footer>
    </div>
  </div>
</template>
