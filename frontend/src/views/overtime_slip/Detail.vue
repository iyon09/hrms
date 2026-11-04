<template>
	<ion-page>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col min-h-full w-full bg-page">
				<PageHeader :title="id" />

				<div v-if="slip.data" class="flex flex-col px-4 pb-8">
					<!-- overview -->
					<div class="flex flex-row items-center gap-3.5 bg-white rounded-card p-4 mt-2">
						<IconTile icon="watch" :color="OVERTIME_COLOR" size="lg" />
						<div class="flex flex-col grow min-w-0 gap-1">
							<span class="font-heading text-[17px] font-semibold text-ink truncate">
								{{ periodLabel(slip.data) }}
							</span>
							<Badge
								class="self-start"
								variant="subtle"
								:theme="statusTheme[status]"
								:label="__(status)"
							/>
						</div>
						<div class="flex flex-col items-end shrink-0">
							<span class="font-heading text-[24px] font-bold text-brand">
								{{ formatHours(slip.data.total_overtime_duration) }}
							</span>
							<span class="text-[12px] text-ink-subtle">{{ __("Total") }}</span>
						</div>
					</div>

					<!-- fields -->
					<div class="w-full bg-white rounded-card overflow-hidden mt-4">
						<template v-for="(field, index) in fields" :key="field.label">
							<div class="flex flex-row items-center justify-between gap-4 px-4 py-3">
								<span class="text-[15px] text-ink-subtle">{{ field.label }}</span>
								<span class="text-[15px] text-ink text-right truncate">{{ field.value }}</span>
							</div>
							<div v-if="index < fields.length - 1" class="ml-4 h-px bg-gray-200/60"></div>
						</template>
					</div>

					<SectionHeader :title="__('Overtime Details')" />

					<div v-if="details.length" class="w-full bg-white rounded-card overflow-hidden">
						<template v-for="(row, index) in details" :key="row.name">
							<div class="flex flex-row items-center gap-3 px-4 py-3">
								<div class="flex flex-col items-center justify-center shrink-0 w-11 rounded-xl bg-brand-tint py-1.5">
									<span class="text-[11px] font-semibold uppercase text-brand">
										{{ dayjs(row.date).format("MMM") }}
									</span>
									<span class="font-heading text-[17px] font-bold leading-5 text-brand">
										{{ dayjs(row.date).format("D") }}
									</span>
								</div>
								<div class="flex flex-col grow min-w-0">
									<span class="text-[15px] font-medium text-ink truncate">
										{{ row.overtime_type || __("Overtime") }}
									</span>
									<span v-if="row.custom_to_do" class="text-[13px] text-ink-subtle line-clamp-2">
										{{ row.custom_to_do }}
									</span>
									<span v-else class="text-[13px] text-ink-subtle">
										{{ dayjs(row.date).format("dddd") }}
									</span>
								</div>
								<span class="text-[15px] font-bold text-ink shrink-0">
									{{ formatHours(row.overtime_duration) }}
								</span>
							</div>
							<div v-if="index < details.length - 1" class="ml-[72px] h-px bg-gray-200/60"></div>
						</template>
					</div>
					<EmptyState v-else :message="__('No daily breakdown recorded.')" />
				</div>

				<div v-else-if="slip.loading" class="flex flex-col gap-4 px-4 mt-2">
					<div class="h-24 bg-white rounded-card animate-pulse"></div>
					<div class="h-48 bg-white rounded-card animate-pulse"></div>
				</div>
				<EmptyState v-else :message="slip.error?.messages?.[0] || __('Could not load overtime slip')" class="mx-4" />
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { computed, inject } from "vue"
import { IonPage, IonContent } from "@ionic/vue"
import { Badge, createResource } from "frappe-ui"

import PageHeader from "@/components/PageHeader.vue"
import SectionHeader from "@/components/SectionHeader.vue"
import IconTile from "@/components/IconTile.vue"
import EmptyState from "@/components/EmptyState.vue"

import { OVERTIME_COLOR, formatHours, periodLabel, slipStatus, statusTheme } from "@/utils/overtime"

const props = defineProps({
	id: {
		type: String,
		required: true,
	},
})

const __ = inject("$translate")
const dayjs = inject("$dayjs")

const slip = createResource({
	url: "frappe.client.get",
	params: { doctype: "Overtime Slip", name: props.id },
	auto: true,
})

const status = computed(() => slipStatus(slip.data?.docstatus))

const details = computed(() =>
	[...(slip.data?.overtime_details || [])].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
)

const formatDate = (date) => (date ? dayjs(date).format("D MMM YYYY") : "—")

const fields = computed(() =>
	[
		{ label: __("Posting Date"), value: formatDate(slip.data.posting_date) },
		{ label: __("Start Date"), value: formatDate(slip.data.start_date) },
		{ label: __("End Date"), value: formatDate(slip.data.end_date) },
		{ label: __("Department"), value: slip.data.department },
		{ label: __("Salary Slip"), value: slip.data.salary_slip },
	].filter((field) => field.value)
)
</script>
