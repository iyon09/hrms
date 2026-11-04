<template>
	<ListItem>
		<template #left>
			<FeatherIcon name="clock" class="h-[30px] w-[30px] p-[6px] shrink-0 rounded-lg text-white bg-[#0E9F6E]" />
			<div class="flex flex-col items-start gap-1.5">
				<div class="text-[17px] text-ink">Log Type: {{ props.doc.log_type }}</div>
				<div class="text-[13px] text-ink-subtle">
					<span>{{ formatTimestamp(props.doc.time) }}</span>
				</div>
			</div>
		</template>
		<template #right>
			<FeatherIcon name="chevron-right" class="h-[17px] w-[17px] text-ink-faint" />
		</template>
	</ListItem>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui"

import ListItem from "@/components/ListItem.vue"
import { formatTimestamp } from "@/utils/formatters"

const props = defineProps({
	doc: {
		type: Object,
	},
})
</script>
