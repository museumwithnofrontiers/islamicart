<script setup>
import { useRouter } from 'vue-router'
import { I18nText } from '@museumwnf/viewer-core'
import { partnerEntrance } from '../dataset.config.js'

const router = useRouter()

function browse(kind, project) {
  router.push({ path: '/partners/results', query: { type: kind, project } })
}

// The th label reads by button kind, the same way legacy's two list pages
// each spoke of "museums" or "institutions" regardless of which project the
// page was for.
function kindLabel(kind) {
  return kind === 'museum' ? 'partner.list.museums' : 'islamicart.partner.others'
}
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('islamicart.nav.partners') }}</h1>

    <div v-for="panel in partnerEntrance" :key="panel.project" class="mwnf-panel">
      <I18nText tag="p" class="intro-text" :keypath="panel.intro" />

      <table class="mwnf-form-table filter-table">
        <tbody>
          <tr v-for="button in panel.buttons" :key="button.kind">
            <th><label>{{ $t(kindLabel(button.kind)) }}</label></th>
            <td>
              <button class="mwnf-button" @click="browse(button.kind, panel.project)">{{ $t(button.action) }} →</button>
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
