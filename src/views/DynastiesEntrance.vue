<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText } from '@museumwnf/viewer-core'
import { useDynasties } from '../composables/dynasties.js'

// Legacy's /dynasties/ start page: the picker on the left — every dynasty,
// "GO" opens its profile — and the introduction on the right.
const router = useRouter()
const { list } = useDynasties()
const picked = ref('')

function go() {
  if (picked.value) router.push({ name: 'dynasty', params: { id: picked.value } })
}
</script>

<template>
  <div class="dynasties-entrance">
    <form class="dynasties-entrance__picker" @submit.prevent="go">
      <select v-model="picked" class="mwnf-select" :aria-label="$t('islamicart.dynasties.pick')">
        <option value="">{{ $t('islamicart.dynasties.pick') }}</option>
        <option v-for="dynasty in list" :key="dynasty.id" :value="dynasty.id">{{ dynasty.name }}</option>
      </select>
      <button type="submit" class="mwnf-button">{{ $t('islamicart.dynasties.go') }}</button>
    </form>
    <I18nText keypath="islamicart.dynasties.intro" class="dynasties-entrance__intro" />
  </div>
</template>

<style scoped>
.dynasties-entrance {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  padding-block: 20px 30px;
  font-size: 14px;
}
.dynasties-entrance__picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 30px;
}
.dynasties-entrance__picker select {
  width: 100%;
}
@media (max-width: 48rem) {
  .dynasties-entrance { grid-template-columns: 1fr; }
}
</style>
