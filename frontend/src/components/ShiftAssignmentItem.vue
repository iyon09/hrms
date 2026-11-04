<template>
	<ListItem>
		<template #left>
			<ShiftIcon class="h-[30px] w-[30px] p-[6px] shrink-0 rounded-lg text-white bg-[#0E9F6E]" />
			<div class="flex flex-col items-start gap-1.5">
				<div class="text-[17px] text-ink">
					{{ props.doc.shift_type }}
				</div>
				<div class="text-[13px] text-ink-subtle">
					<span>{{ props.doc.shift_dates || getShiftDates(props.doc) }}</span>
					<span v-if="props.doc.end_date" class="whitespace-pre"> &middot; </span>
					<span v-if="props.doc.end_date" class="whitespace-nowrap">{{ __("{0}d", [props.doc.total_shift_days || getTotalShiftDays(props.doc)]) }}</span>
				</div>
			</div>
		</template>
		<template #right>
			<span v-if="props.doc.shift_timing" class="text-gray-700 font-normal rounded text-base">
				{{ props.doc.shift_timing }}
			</span>
			<Badge v-else variant="outline" :theme="colorMap[status]" :label="status" size="md" />
			<FeatherIcon name="chevron-right" class="h-[17px] w-[17px] text-ink-faint" />
		</template>
	</ListItem>
</template>

<script setup>
import { computed } from "vue"
import { Badge, FeatherIcon } from "frappe-ui"

import ListItem from "@/components/ListItem.vue"
import ShiftIcon from "@/components/icons/ShiftIcon.vue"
import { getShiftDates, getTotalShiftDays } from "@/data/attendance"

const props = defineProps({
	doc: {
		type: Object,
	},
})

const status = computed(() => {
	if (props.workflowStateField) return props.doc[props.workflowStateField]
	return props.doc.docstatus ? "Submitted" : "Draft"
})

const colorMap = {
	Draft: "gray",
	Submitted: "blue",
}
</script>
