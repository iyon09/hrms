<template>
	<div ref="rootRef" class="w-full">
		<button
			type="button"
			class="flex w-full items-center justify-between gap-2 rounded-xl bg-[#F1F3F6] px-3 py-2.5 text-left"
			@click="toggle"
		>
			<span class="truncate text-[15px]" :class="selectedLabel ? 'text-ink' : 'text-ink-subtle'">
				{{ selectedLabel || placeholder }}
			</span>
			<FeatherIcon
				:name="open ? 'chevron-up' : 'chevron-down'"
				class="h-4 w-4 shrink-0 text-ink-subtle"
			/>
		</button>

		<div v-if="open" class="mt-1.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
			<div class="relative">
				<input
					ref="inputRef"
					v-model="query"
					type="search"
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					enterkeyhint="search"
					class="form-input w-full pr-8"
					:placeholder="__('Search')"
					@keydown.enter.prevent="matches.length && pick(matches[0])"
					@keydown.esc="close"
				/>
				<button
					v-if="query"
					type="button"
					class="absolute right-0 top-0 flex h-full w-8 items-center justify-center"
					:aria-label="__('Clear')"
					@click="query = ''"
				>
					<FeatherIcon name="x" class="h-4 w-4 text-ink-subtle" />
				</button>
			</div>
			<ul class="mt-1 max-h-60 overflow-y-auto">
				<li
					v-for="option in matches.slice(0, LIMIT)"
					:key="option.value"
					class="cursor-pointer truncate rounded-lg px-2.5 py-2 text-[15px] text-ink active:bg-gray-100"
					:class="{ 'bg-gray-100 font-semibold': option.value === modelValue }"
					@click="pick(option)"
				>
					{{ option.label }}
				</li>
				<li v-if="!matches.length" class="px-2.5 py-2 text-[14px] text-ink-subtle">
					{{ __("No results found") }}
				</li>
				<li v-else-if="matches.length > LIMIT" class="px-2.5 py-2 text-[13px] text-ink-subtle">
					{{ __("{0} more, keep typing to narrow down", [matches.length - LIMIT]) }}
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup>
// Searchable single-choice picker. Filters on every keystroke (frappe-ui's
// Autocomplete only filters on the input's change event, which on phones
// fires after the keyboard closes, so search looked broken).
import { computed, nextTick, onBeforeUnmount, ref } from "vue"
import { FeatherIcon } from "frappe-ui"

const LIMIT = 100

const props = defineProps({
	options: { type: Array, default: () => [] }, // [{ label, value }]
	modelValue: { type: [String, null], default: null },
	placeholder: { type: String, default: "" },
})
const emit = defineEmits(["update:modelValue"])

const rootRef = ref(null)
const inputRef = ref(null)
const open = ref(false)
const query = ref("")

const selectedLabel = computed(
	() => props.options.find((o) => o.value === props.modelValue)?.label || props.modelValue || ""
)

const matches = computed(() => {
	const words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
	if (!words.length) return props.options
	return props.options.filter((o) => {
		const text = `${o.label} ${o.value}`.toLowerCase()
		return words.every((w) => text.includes(w))
	})
})

function onOutside(event) {
	if (rootRef.value && !rootRef.value.contains(event.target)) close()
}

function toggle() {
	open.value ? close() : openPicker()
}

async function openPicker() {
	query.value = ""
	open.value = true
	document.addEventListener("pointerdown", onOutside)
	await nextTick()
	inputRef.value?.focus()
}

function close() {
	open.value = false
	document.removeEventListener("pointerdown", onOutside)
}

function pick(option) {
	emit("update:modelValue", option.value)
	close()
}

onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside))
</script>
