<script setup>
// viewer-layout's own SiteShell composes PageShell from dataset.config.js's
// `navigation` (the menu, the active entry, the footer link list) — see its
// README "Site shell" section. This file supplies only what a config cannot:
// the header lockup ("Museum With No Frontiers" over "Islamic Art"), through
// the #brand slot, and the footer copyright line (`config.navigation` has no
// field for a plain footer text). Everything else — $attrs, listeners such as
// `update:language` — passes straight through.
//
// Exported from `/components`, not the package root (it reads
// `@museumwnf/viewer-core` itself); the Vitest config lists `viewer-layout`
// in `server.deps.inline` for the same reason.
import { SiteShell } from '@museumwnf/viewer-layout/components'
</script>

<template>
  <SiteShell v-bind="$attrs" :footer-text="$t('standalone.identity.copyright')">
    <template #brand>
      <a class="site-logo" href="#/">
        <span class="site-logo-org">{{ $t('standalone.identity.organisation') }}</span>
        <span class="site-logo-title">{{ $t('islamicart.identity.title') }}</span>
      </a>
    </template>
    <slot />
  </SiteShell>
</template>

<style scoped>
.site-logo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--header-fg);
  text-decoration: none !important;
}
.site-logo-org {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 400;
  opacity: 0.8;
}
.site-logo-title {
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-shadow: 2px 2px 4px var(--accent-light);
}
.site-logo:hover {
  color: var(--header-fg);
}
</style>
