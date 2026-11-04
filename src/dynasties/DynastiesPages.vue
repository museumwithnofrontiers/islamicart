<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

// The client's page navigation (PagesComponent): "<<First", "<Previous", a
// window of page numbers, "Next>", "Last>>"; the page the visitor is on, and
// the ways that lead nowhere, disabled. The window is as wide as the client
// made it for the width it was opened at: 15 numbers, 11 from 849px down, 9
// from 724px, 5 from 599px; the words go below 500px.
const props = defineProps({
  current: { type: Number, required: true },
  last: { type: Number, required: true },
})
const emit = defineEmits(['go'])

const widths = { 849: ref(false), 724: ref(false), 599: ref(false), 499: ref(false) }
// Where the browser can't say (a test's document), the widest.
const queries = Object.entries(widths).map(([width, flag]) => {
  const query = globalThis.matchMedia?.(`(max-width: ${width}px)`)
  if (!query) return () => {}
  const update = () => { flag.value = query.matches }
  update()
  query.addEventListener('change', update)
  return () => query.removeEventListener('change', update)
})
onBeforeUnmount(() => queries.forEach((stop) => stop()))

// The client's setRange(): the window's first and last number.
function range(before, after, size) {
  const { current, last } = props
  if (last <= size) return [1, last]
  let first = 1
  let end
  if (current > before) first = current - after
  if (current + after < last) end = first <= after && current <= after ? size : current + after
  else {
    first = last - (size - 1)
    end = last
  }
  return [first, end]
}

const numbers = computed(() => {
  const [first, end] = widths[599].value ? range(3, 2, 5)
    : widths[724].value ? range(5, 4, 9)
    : widths[849].value ? range(6, 5, 11)
    : range(8, 7, 15)
  return Array.from({ length: end - first + 1 }, (_, i) => first + i)
})
const words = computed(() => !widths[499].value)
const disabled = (page) => page < 1 || page > props.last || page === props.current
</script>

<template>
  <div class="dyn-pages">
    <button type="button" class="dyn-pages__button" :disabled="disabled(1)" @click="emit('go', 1)">&lt;&lt;<span v-if="words">{{ $t('islamicart.dynasties.first') }}</span></button>
    <button type="button" class="dyn-pages__button" :disabled="disabled(current - 1)" @click="emit('go', current - 1)">&lt;<span v-if="words">{{ $t('islamicart.pcr.previous') }}</span></button>
    <div class="dyn-pages__numbers">
      <button v-for="page in numbers" :key="page" type="button" class="dyn-pages__button" :disabled="disabled(page)" @click="emit('go', page)">{{ page }}</button>
    </div>
    <button type="button" class="dyn-pages__button" :disabled="disabled(current + 1)" @click="emit('go', current + 1)"><span v-if="words">{{ $t('islamicart.pcr.next') }}</span>&gt; </button>
    <button type="button" class="dyn-pages__button" :disabled="disabled(last)" @click="emit('go', last)"><span v-if="words">{{ $t('islamicart.dynasties.last') }}</span>&gt;&gt; </button>
  </div>
</template>

<style scoped>
.dyn-pages {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dyn-pages__numbers {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dyn-pages__button {
  margin: 0 5px;
  padding: 5px;
  color: #000;
  text-decoration: underline;
  background-color: transparent;
  border: none;
  outline: none;
  cursor: pointer;
}

.dyn-pages__button:disabled {
  color: rgba(16, 16, 16, 0.3);
  cursor: default;
}
</style>
