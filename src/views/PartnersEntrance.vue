<script setup>
import { useRouter } from 'vue-router'
import { I18nText } from '@museumwnf/viewer-core'
import { PROJECTS } from '../dataset.config.js'

const router = useRouter()

function browse(kind, project) {
  router.push({ path: '/partners/results', query: { type: kind, project } })
}
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('islamicart.nav.partners') }}</h1>

    <div class="mwnf-panel">
      <I18nText tag="p" class="intro-text" keypath="islamicart.partner.introDiscover" />

      <table class="mwnf-form-table filter-table">
        <tbody>
          <tr>
            <th><label>{{ $t('partner.list.museums') }}</label></th>
            <td>
              <button class="mwnf-button" @click="browse('museum', PROJECTS.discover)">{{ $t('islamicart.action.browseMuseums') }} →</button>
            </td>
          </tr>
          <tr>
            <th><label>{{ $t('islamicart.partner.others') }}</label></th>
            <td>
              <button class="mwnf-button" @click="browse('institution', PROJECTS.discover)">{{ $t('islamicart.action.browseInstitutions') }} →</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mwnf-panel">
      <I18nText tag="p" class="intro-text" keypath="islamicart.partner.introExplore" />

      <table class="mwnf-form-table filter-table">
        <tbody>
          <tr>
            <th><label>{{ $t('partner.list.museums') }}</label></th>
            <td>
              <button class="mwnf-button" @click="browse('museum', PROJECTS.explore)">{{ $t('islamicart.action.browseMuseums') }} →</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}

/* This page's own override of the shared form table: a browse label reads
   left-to-right here, not the label/value pair `.mwnf-form-table` themes. */
.filter-table th {
  text-align: left;
  font-weight: normal;
  padding: 10px 16px 10px 0;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
  width: auto;
}
</style>
