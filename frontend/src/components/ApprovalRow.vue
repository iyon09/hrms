<template>
	<button class="flex flex-row items-center gap-3.5 w-full px-4 py-3 text-left active:bg-gray-100 transition-colors">
		<IconTile :icon="tab.icon" :color="tab.color" />
		<div class="flex flex-col grow min-w-0">
			<span class="text-[16px] font-medium text-ink truncate">{{ item.employee_name }}</span>
			<span class="text-[13px] text-ink-subtle truncate">{{ item.summary }}</span>
		</div>
		<span
			v-if="showState"
			class="max-w-[110px] truncate text-[13px] font-medium shrink-0"
			:style="{ color: stateColor(item.state) }"
		>
			{{ __(item.state) }}
		</span>
		<FeatherIcon name="chevron-right" class="h-[17px] w-[17px] text-ink-faint shrink-0" />
	</button>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui"

import IconTile from "@/components/IconTile.vue"

defineProps({
	item: { type: Object, required: true },
	tab: { type: Object, required: true },
	showState: { type: Boolean, default: false },
})

function stateColor(state = "") {
	const s = state.toLowerCase()
	if (/reject|cancel/.test(s)) return "#B91C1C"
	if (/approv/.test(s)) return "#047857"
	return "#B45309"
}
</script>
