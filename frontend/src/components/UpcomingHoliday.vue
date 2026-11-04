<template>
	<template v-if="holiday">
		<SectionHeader :title="__('Upcoming Holiday')" />
		<div class="w-full bg-white rounded-card overflow-hidden">
			<GroupRow
				icon="calendar"
				color="#EF4444"
				:title="holiday.description"
				:subtitle="dayjs(holiday.holiday_date).format('dddd, D MMM')"
			>
				<template #trailing>
					<span class="text-[15px] text-ink-subtle whitespace-nowrap">{{ when }}</span>
				</template>
			</GroupRow>
		</div>
	</template>
</template>

<script setup>
import { computed, inject } from "vue"
import { createResource } from "frappe-ui"

import SectionHeader from "@/components/SectionHeader.vue"
import GroupRow from "@/components/GroupRow.vue"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const employee = inject("$employee")

const holidays = createResource({
	url: "hrms.api.get_holidays_for_employee",
	params: { employee: employee.data.name },
	auto: true,
	cache: "hrms:holidays",
})

const holiday = computed(() => {
	const today = dayjs().startOf("day")
	return (holidays.data || []).find((h) => !dayjs(h.holiday_date).isBefore(today))
})

const when = computed(() => {
	const days = dayjs(holiday.value.holiday_date).diff(dayjs().startOf("day"), "day")
	if (days === 0) return __("Today")
	if (days === 1) return __("Tomorrow")
	return __("In {0} days", [days])
})
</script>
