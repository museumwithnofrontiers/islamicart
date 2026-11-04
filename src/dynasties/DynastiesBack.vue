<script setup>
import { REPLY } from './icons.js'

// Legacy's way back in the Islamic Dynasties client (#back): "Back" to the
// page before, or to `to` where the client named it, then the start page;
// each after the client's reply icon, 1em high.
defineProps({
  to: { type: Object, default: null },
})
</script>

<template>
  <div class="dyn-back">
    <RouterLink v-if="to" :to="to">
      <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="REPLY" /></svg>
      {{ $t('islamicart.item.back') }}
    </RouterLink>
    <button v-else type="button" @click="$router.back()">
      <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="REPLY" /></svg>
      {{ $t('islamicart.item.back') }}
    </button>
    <RouterLink :to="{ name: 'dynasties' }">
      <svg class="dyn-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" :d="REPLY" /></svg>
      {{ $t('islamicart.dynasties.startPage') }}
    </RouterLink>
  </div>
</template>

<style scoped>
.dyn-back {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding: 0 50px 30px 0;
  font-size: 14px;
}

.dyn-back button,
.dyn-back a {
  padding: 2px 8px 2px 0;
  font-weight: 500;
  color: #222;
  text-decoration: none;
  background-color: transparent;
  border: none;
  outline: none;
  cursor: pointer;
}

@media (max-width: 599px) {
  .dyn-back { padding: 0 0 30px; }
}
</style>
