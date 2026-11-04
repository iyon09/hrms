<template>
	<div class="flex flex-col w-full">
		<div class="px-1 pt-7 pb-2.5 font-heading text-xl font-bold text-ink">
			{{ title || __("Quick Links") }}
		</div>
		<div class="flex flex-col bg-white rounded-card overflow-hidden">
			<template v-for="(link, index) in props.items" :key="link.title">
				<router-link
					class="flex flex-row items-center gap-3.5 px-4 py-[11px] active:bg-gray-100 transition-colors"
					:to="{ name: link.route }"
				>
					<IconTile :icon="link.icon" :color="link.color" />
					<div class="flex flex-col grow min-w-0">
						<div class="text-[17px] text-ink truncate">{{ link.title }}</div>
						<div v-if="link.subtitle" class="text-[13px] text-ink-subtle truncate">
							{{ link.subtitle }}
						</div>
					</div>
					<FeatherIcon name="chevron-right" class="h-[17px] w-[17px] text-ink-faint shrink-0" />
				</router-link>
				<div v-if="index < props.items.length - 1" class="ml-[60px] h-px bg-gray-200/60"></div>
			</template>
		</div>
	</div>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui"

import IconTile from "@/components/IconTile.vue"

const props = defineProps({
	title: {
		type: String,
		required: false,
		default: "",
	},
	items: {
		type: Array,
		required: true,
	},
})
</script>
