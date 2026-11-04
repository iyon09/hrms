<template>
	<component
		:is="to ? 'router-link' : 'div'"
		:to="to"
		class="flex flex-row items-center gap-3.5 px-4 py-[11px]"
		:class="to && 'active:bg-gray-100 transition-colors'"
	>
		<IconTile :icon="icon" :color="color" />
		<div class="flex flex-col grow min-w-0">
			<div class="text-[17px] text-ink truncate">{{ title }}</div>
			<div v-if="subtitle" class="text-[13px] text-ink-subtle truncate">{{ subtitle }}</div>
		</div>
		<slot name="trailing" />
		<FeatherIcon v-if="to" name="chevron-right" class="h-[17px] w-[17px] text-ink-faint shrink-0" />
	</component>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui"

import IconTile from "@/components/IconTile.vue"

defineProps({
	icon: { type: String, required: true },
	color: { type: String, default: "#64748B" },
	title: { type: String, required: true },
	subtitle: { type: String, default: "" },
	to: { type: Object, default: null },
})
</script>
