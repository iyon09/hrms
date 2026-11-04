<template>
	<BaseLayout :pageTitle="greeting" :subtitle="subtitle">
		<template #body>
			<!-- same section order as the Flutter dashboard -->
			<div class="flex flex-col items-center px-4 pt-1 pb-8">
				<CheckInPanel />
				<HoursChart />
				<UpcomingHoliday />
				<RecentActivity />

				<template v-if="pendingApprovalsCount">
					<SectionHeader :title="__('Pending Approvals')" />
					<div class="w-full bg-white rounded-card overflow-hidden">
						<GroupRow
							icon="check-circle"
							color="#0E7C5A"
							:title="__('Approvals')"
							:subtitle="approvalsSubtitle"
							:to="{ name: 'Approvals' }"
						>
							<template #trailing>
								<span class="min-w-[24px] rounded-full bg-red-500 px-2 text-center text-[13px] font-semibold leading-6 text-white">
									{{ pendingApprovalsCount > 99 ? "99+" : pendingApprovalsCount }}
								</span>
							</template>
						</GroupRow>
					</div>
				</template>

				<SectionHeader :title="__('Profile')" />
				<div class="w-full bg-white rounded-card overflow-hidden">
					<GroupRow
						icon="user"
						color="#64748B"
						:title="employee?.data?.employee_name || __('Employee details')"
						:subtitle="employee?.data?.name"
						:to="{ name: 'Profile' }"
					/>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { computed, inject, onMounted } from "vue"

import BaseLayout from "@/components/BaseLayout.vue"
import CheckInPanel from "@/components/CheckInPanel.vue"
import HoursChart from "@/components/HoursChart.vue"
import UpcomingHoliday from "@/components/UpcomingHoliday.vue"
import RecentActivity from "@/components/RecentActivity.vue"
import SectionHeader from "@/components/SectionHeader.vue"
import GroupRow from "@/components/GroupRow.vue"

import { approvals, pendingApprovalsCount } from "@/data/approvals"
import { useListUpdate } from "@/composables/realtime"

const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")
const socket = inject("$socket")

const greeting = computed(() => {
	const hour = dayjs().hour()
	if (hour < 12) return __("Good morning")
	if (hour < 18) return __("Good afternoon")
	return __("Good evening")
})

const subtitle = computed(() =>
	[employee?.data?.employee_name, employee?.data?.designation].filter(Boolean).join(" · ")
)

// e.g. "3 Leave · 2 Claim"
const approvalsSubtitle = computed(() =>
	(approvals.data || [])
		.filter((tab) => tab.count)
		.map((tab) => `${tab.count} ${__(tab.label)}`)
		.join(" · ")
)

onMounted(() => {
	for (const doctype of ["Leave Application", "Expense Claim", "Shift Request", "Attendance Request"]) {
		useListUpdate(socket, doctype, () => approvals.reload())
	}
})
</script>
