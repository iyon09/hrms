<template>
	<ion-page>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col min-h-full w-full bg-page">
				<PageHeader :title="__('Overtime')" />

				<div class="flex flex-col px-4 pb-8">
					<!-- summary, like the Flutter OvertimePage metric grid -->
					<div class="grid grid-cols-2 gap-3 mt-2">
						<div v-for="metric in metrics" :key="metric.label" class="flex flex-col gap-1 bg-white rounded-card p-4">
							<span class="text-[13px] font-medium text-ink-subtle">{{ metric.label }}</span>
							<span class="font-heading text-[22px] font-bold text-ink">{{ metric.value }}</span>
						</div>
					</div>

					<SectionHeader :title="__('Overtime Slip History')" />

					<div v-if="slips.data?.length" class="w-full bg-white rounded-card overflow-hidden">
						<template v-for="(slip, index) in slips.data" :key="slip.name">
							<GroupRow
								icon="watch"
								:color="OVERTIME_COLOR"
								:title="slip.name"
								:subtitle="periodLabel(slip)"
								:to="{ name: 'OvertimeSlipDetailView', params: { id: slip.name } }"
							>
								<template #trailing>
									<div class="flex flex-col items-end gap-1 shrink-0">
										<span class="text-[15px] font-bold text-ink">
											{{ formatHours(slip.total_overtime_duration) }}
										</span>
										<Badge
											variant="subtle"
											:theme="statusTheme[slipStatus(slip.docstatus)]"
											:label="__(slipStatus(slip.docstatus))"
										/>
									</div>
								</template>
							</GroupRow>
							<div v-if="index < slips.data.length - 1" class="ml-[60px] h-px bg-gray-200/60"></div>
						</template>
					</div>
					<div v-else-if="slips.loading" class="w-full h-40 bg-white rounded-card animate-pulse"></div>
					<EmptyState v-else :message="__('No overtime slips yet')" />
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { computed, inject } from "vue"
import { IonPage, IonContent } from "@ionic/vue"
import { Badge, createListResource } from "frappe-ui"

import PageHeader from "@/components/PageHeader.vue"
import SectionHeader from "@/components/SectionHeader.vue"
import GroupRow from "@/components/GroupRow.vue"
import EmptyState from "@/components/EmptyState.vue"

import { OVERTIME_COLOR, formatHours, periodLabel, slipStatus, statusTheme } from "@/utils/overtime"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const employee = inject("$employee")

// an employee has a handful of slips a year, so load them all and summarise here
const slips = createListResource({
	doctype: "Overtime Slip",
	fields: ["name", "start_date", "end_date", "total_overtime_duration", "docstatus"],
	filters: { employee: employee.data.name },
	orderBy: "start_date desc, creation desc",
	pageLength: 500,
	auto: true,
})

const metrics = computed(() => {
	const all = slips.data || []
	const monthTotal = all
		.filter((slip) => slip.docstatus !== 2 && dayjs(slip.start_date).isSame(dayjs(), "month"))
		.reduce((sum, slip) => sum + (slip.total_overtime_duration || 0), 0)
	return [
		{ label: __("This Month"), value: dayjs().format("MMM YYYY") },
		{ label: __("This Month Overtime"), value: formatHours(monthTotal) },
		{ label: __("Draft Slips"), value: all.filter((slip) => slip.docstatus === 0).length },
		{ label: __("Submitted Slips"), value: all.filter((slip) => slip.docstatus === 1).length },
	]
})
</script>
