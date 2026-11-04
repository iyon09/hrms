<template>
	<SectionHeader :title="__('Hours')">
		<template #trailing>
			<div class="flex p-0.5 rounded-lg bg-[#D5DAE2]">
				<button
					v-for="option in ranges"
					:key="option.value"
					class="px-2.5 py-1 rounded-md text-[13px] font-semibold text-ink transition-all"
					:class="range === option.value && 'bg-white shadow-sm'"
					@click="setRange(option.value)"
				>
					{{ option.label }}
				</button>
			</div>
		</template>
	</SectionHeader>

	<div class="flex flex-col bg-white rounded-card w-full px-5 pt-[18px] pb-4">
		<div class="flex flex-row items-end">
			<div class="flex flex-col grow">
				<span class="text-[13px] font-semibold text-ink-subtle">{{ __("Total") }}</span>
				<span>
					<span class="text-[28px] font-bold text-ink leading-tight">{{ total.toFixed(1) }}</span>
					<span class="text-[17px] font-semibold text-ink-subtle"> {{ __("hrs") }}</span>
				</span>
				<span class="text-[13px] text-ink-subtle">{{ periodLabel }}</span>
			</div>
			<button
				class="flex items-center justify-center h-8 w-8 rounded-full bg-[#E9ECF1] text-ink"
				:aria-label="__('Previous')"
				@click="offset--"
			>
				<FeatherIcon name="chevron-left" class="h-4 w-4" />
			</button>
			<button
				class="flex items-center justify-center h-8 w-8 ml-2 rounded-full bg-[#E9ECF1] disabled:text-ink-faint text-ink"
				:aria-label="__('Next')"
				:disabled="offset >= 0"
				@click="offset++"
			>
				<FeatherIcon name="chevron-right" class="h-4 w-4" />
			</button>
		</div>

		<div class="flex flex-row items-end mt-4 h-[136px]">
			<div v-for="bar in bars" :key="bar.key" class="flex flex-col items-center justify-end flex-1 h-full">
				<span
					class="mb-1 text-[11px] font-bold leading-none"
					:class="bar.special ? bar.special.text : bar.hours > 0 ? 'text-ink' : bar.isOff ? 'text-ink-faint font-normal' : 'text-amber-500'"
				>
					<template v-if="bar.special">{{ bar.special.label }}</template>
					<template v-else-if="bar.hours > 0">{{ bar.hours.toFixed(1) }}h</template>
					<template v-else-if="bar.isFuture">&nbsp;</template>
					<template v-else-if="bar.isOff">{{ __("Off") }}</template>
					<template v-else>–</template>
				</span>
				<div
					class="w-5 rounded-md transition-all duration-500"
					:class="barClass(bar)"
					:style="{ height: `${barHeight(bar)}px` }"
				></div>
			</div>
		</div>

		<div class="flex flex-row mt-1.5">
			<div v-for="bar in bars" :key="bar.key" class="flex flex-col items-center flex-1">
				<span v-if="bar.isToday" class="h-1 w-1 mb-[3px] rounded-full bg-brand"></span>
				<span
					class="text-[11px]"
					:class="bar.isToday ? 'font-bold text-brand' : 'font-medium text-ink-faint'"
				>
					{{ bar.label }}
				</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, ref, watch } from "vue"
import { FeatherIcon, createListResource, createResource } from "frappe-ui"

import SectionHeader from "@/components/SectionHeader.vue"
import { myLeaves } from "@/data/leaves"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const employee = inject("$employee")

const PLOT_HEIGHT = 96
const ranges = [
	{ value: "weekly", label: __("Weekly") },
	{ value: "monthly", label: __("Monthly") },
]

const range = ref("weekly")
const offset = ref(0)

function setRange(value) {
	if (value === range.value) return
	range.value = value
	offset.value = 0
}

// weeks start on Monday
const period = computed(() => {
	const today = dayjs().startOf("day")
	if (range.value === "weekly") {
		const start = today.subtract((today.day() + 6) % 7, "day").add(7 * offset.value, "day")
		return { start, end: start.add(6, "day") }
	}
	const start = today.startOf("month").add(offset.value, "month")
	return { start, end: start.endOf("month").startOf("day") }
})

const checkins = createListResource({
	doctype: "Employee Checkin",
	fields: ["name", "log_type", "time"],
	orderBy: "time asc",
	pageLength: 500,
})

watch(
	period,
	({ start, end }) => {
		checkins.update({
			filters: {
				employee: employee.data.name,
				time: [
					"between",
					[start.format("YYYY-MM-DD"), end.add(1, "day").format("YYYY-MM-DD")],
				],
			},
		})
		checkins.reload()
	},
	{ immediate: true }
)

const holidays = createResource({
	url: "hrms.api.get_holidays_for_employee",
	params: { employee: employee.data.name },
	auto: true,
	cache: "hrms:holidays",
})

const holidayDates = computed(() => new Set((holidays.data || []).map((h) => h.holiday_date)))

const leaveDates = computed(() => {
	const dates = new Set()
	for (const leave of myLeaves.data || []) {
		const status = leave.workflow_state_field ? leave[leave.workflow_state_field] : leave.status
		if (status !== "Approved") continue
		for (let d = dayjs(leave.from_date); !d.isAfter(dayjs(leave.to_date)); d = d.add(1, "day"))
			dates.add(d.format("YYYY-MM-DD"))
	}
	return dates
})

// first check-in to last check-out of the day; an open check-in today runs until now
function hoursForDay(date) {
	const logs = (checkins.data || []).filter((c) => dayjs(c.time).isSame(date, "day"))
	if (!logs.length) return 0
	const first = dayjs(logs[0].time)
	const last = logs[logs.length - 1]
	const end = last.log_type === "IN" && date.isSame(dayjs(), "day") ? dayjs() : dayjs(last.time)
	return Math.max(end.diff(first, "minute") / 60, 0)
}

function specialDay(date) {
	const key = date.format("YYYY-MM-DD")
	if (leaveDates.value.has(key)) return { label: __("Leave"), text: "text-[#3B82F6]", bar: "bg-[#3B82F6]" }
	if (holidayDates.value.has(key)) return { label: __("Holiday"), text: "text-ink-subtle", bar: "bg-ink-subtle" }
	return null
}

const bars = computed(() => {
	const today = dayjs().startOf("day")
	const { start, end } = period.value

	if (range.value === "weekly") {
		return [...Array(7).keys()].map((i) => {
			const date = start.add(i, "day")
			return {
				key: i,
				label: date.format("ddd"),
				hours: hoursForDay(date),
				isFuture: date.isAfter(today),
				isOff: [0, 6].includes(date.day()),
				isToday: date.isSame(today, "day"),
				special: specialDay(date),
			}
		})
	}

	// monthly: one bar per 7-day block
	const weeks = []
	for (let from = start, week = 1; !from.isAfter(end); from = from.add(7, "day"), week++) {
		const to = from.add(6, "day").isAfter(end) ? end : from.add(6, "day")
		let hours = 0
		for (let d = from; !d.isAfter(to); d = d.add(1, "day")) hours += hoursForDay(d)
		weeks.push({
			key: week,
			label: `W${week}`,
			hours,
			isFuture: from.isAfter(today),
			isOff: false,
			isToday: !today.isBefore(from) && !today.isAfter(to),
			special: null,
		})
	}
	return weeks
})

const total = computed(() => bars.value.reduce((sum, bar) => sum + bar.hours, 0))
const scaleMax = computed(() => Math.max(8, ...bars.value.map((bar) => bar.hours)))

const periodLabel = computed(() => {
	const { start, end } = period.value
	if (range.value === "weekly") {
		if (offset.value === 0) return __("This Week")
		if (offset.value === -1) return __("Last Week")
		return `${start.format("D MMM")} – ${end.format("D MMM")}`
	}
	if (offset.value === 0) return __("This Month")
	if (offset.value === -1) return __("Last Month")
	return start.format("MMMM YYYY")
})

function barHeight(bar) {
	if (bar.special) return PLOT_HEIGHT * 0.5
	if (bar.hours > 0) return (bar.hours / scaleMax.value) * PLOT_HEIGHT
	if (bar.isFuture || bar.isOff) return 10
	return 20
}

function barClass(bar) {
	if (bar.special) return bar.special.bar
	if (bar.hours > 0) return "bg-brand"
	if (bar.isFuture) return "border border-gray-200"
	if (bar.isOff) return "bg-gray-100"
	// missed working day
	return "border-[1.5px] border-amber-500"
}
</script>
