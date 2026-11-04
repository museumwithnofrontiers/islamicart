<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText } from '@museumwnf/viewer-core'
import { useDynasties } from '../composables/dynasties.js'
import DynastiesFrame from '../dynasties/DynastiesFrame.vue'

// Legacy's /dynasties/ start page: the picker on the left — every dynasty,
// "GO" opens its profile — and the introduction on the right; one under the
// other below 850px.
const router = useRouter()
const { list } = useDynasties()
const picked = ref('')

function go() {
  if (picked.value) router.push({ name: 'dynasty', params: { id: picked.value } })
}
</script>

<template>
  <DynastiesFrame>
    <div class="dyn-entrance">
      <form class="dyn-entrance__picker" @submit.prevent="go">
        <select v-model="picked" class="dyn-entrance__select" :aria-label="$t('islamicart.dynasties.pick')">
          <option value="">{{ $t('islamicart.dynasties.pick') }}</option>
          <option v-for="dynasty in list" :key="dynasty.id" :value="dynasty.id">{{ dynasty.name }}</option>
        </select>
        <div class="dyn-entrance__go">
          <button type="submit">{{ $t('islamicart.dynasties.go') }}</button>
        </div>
      </form>
      <I18nText keypath="islamicart.dynasties.intro" class="dyn-entrance__description" />
    </div>
  </DynastiesFrame>
</template>

<style scoped>
.dyn-entrance {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  background-color: #fff;
}

.dyn-entrance__picker {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  width: 45%;
  padding: 60px;
}

.dyn-entrance__select {
  width: 100%;
  max-width: 350px;
  padding: 4px;
}

.dyn-entrance__go {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 350px;
}

.dyn-entrance__go button {
  margin-top: 10px;
  padding: 4px 15px;
  color: #222;
  background-color: #ffd500;
  border: none;
  border-radius: 100px;
  outline: none;
  cursor: pointer;
}

/* The text: one block, its paragraphs a blank line apart (legacy's <br><br>). */
.dyn-entrance__description {
  width: 55%;
  padding: 50px 75px 50px 0;
}

.dyn-entrance__description :deep(p + p) {
  margin-top: 1lh;
}

@media (max-width: 849px) {
  .dyn-entrance { flex-direction: column; }

  .dyn-entrance__picker {
    width: 100%;
    align-items: center;
  }

  .dyn-entrance__description {
    align-self: center;
    width: 100%;
    padding: 0 50px 50px;
  }
}

@media (max-width: 599px) {
  .dyn-entrance__picker { padding: 30px; }
  .dyn-entrance__description { padding: 0 30px 30px; }
}
</style>
