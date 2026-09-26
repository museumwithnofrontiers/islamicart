<script setup>
import { I18nText } from '@museumwnf/viewer-core'
import { SearchFormView } from '@museumwnf/viewer-layout/views'
import { databaseSearchSpec } from '../composables/search.js'

// The search entrance is the platform's composed search form, rendering the
// spec in composables/search.js. What is this website's is the heading and
// the intro paragraph legacy printed above the form.
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('standalone.nav.database') }}</h1>

    <div class="mwnf-panel">
      <SearchFormView :spec="databaseSearchSpec">
        <template #intro>
          <I18nText tag="p" class="intro-text" keypath="catalogue.search.intro" />
        </template>
      </SearchFormView>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text);
  margin-bottom: 16px;
}
</style>
