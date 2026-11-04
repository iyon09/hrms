<template>
	<template v-if="items.length">
		<SectionHeader :title="__('Recent Activity')" />
		<div class="w-full bg-white rounded-card overflow-hidden">
			<template v-for="(item, index) in items" :key="item.key">
				<GroupRow
					:icon="item.icon"
					:color="item.color"
					:title="item.title"
					:subtitle="dayjs(item.date).format('D MMM YYYY')"
					:to="item.to"
				>
					<template #trailing>
						<span
							class="max-w-[120px] truncate text-[15px] font-medium"
							:style="{ color: statusColor(item.status) }"
						>
							{{ __(item.status) }}
						</span>
					</template>
				</GroupRow>
				<div v-if="index < items.length - 1" class="ml-[60px] h-px bg-gray-200/60"></div>
			</template>
		</div>
	</template>
</template>

<script setup>
import { computed, inject } from "vue"
import { createListResource } from "frappe-ui"

import SectionHeader from "@/components/SectionHeader.vue"
import GroupRow from "@/components/GroupRow.vue"
import { myLeaves } from "@/data/leaves"
import { myClaims } from "@/data/claims"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const employee = inject("$employee")

const advances = createListResource({
	doctype: "Employee Advance",
	fields: ["name", "purpose", "posting_date", "status"],
	filters: { employee: employee.data.name },
	orderBy: "posting_date desc",
	pageLength: 4,
	auto: true,
})

const workflowStatus = (doc, fallback) =>
	(doc.workflow_state_field && doc[doc.workflow_state_field]) || fallback || "—"

// newest leave / claim / advance events across modules
const items = computed(() =>
	[
		...(myLeaves.data || []).map((leave) => ({
			key: leave.name,
			icon: "sun",
			color: "#3B82F6",
			title: leave.leave_type.toLowerCase().endsWith("leave")
				? leave.leave_type
				: `${leave.leave_type} Leave`,
			date: leave.from_date,
			status: workflowStatus(leave, leave.status),
			to: { name: "LeaveApplicationDetailView", params: { id: leave.name } },
		})),
		...(myClaims.data || []).map((claim) => ({
			key: claim.name,
			icon: "file-text",
			color: "#F59E0B",
			title: __("Expense Claim"),
			date: claim.posting_date,
			status: workflowStatus(claim, claim.approval_status || claim.status),
			to: { name: "ExpenseClaimDetailView", params: { id: claim.name } },
		})),
		...(advances.data || []).map((advance) => ({
			key: advance.name,
			icon: "dollar-sign",
			color: "#10B981",
			title: advance.purpose || __("Employee Advance"),
			date: advance.posting_date,
			status: advance.status || "—",
			to: { name: "EmployeeAdvanceDetailView", params: { id: advance.name } },
		})),
	]
		.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
		.slice(0, 4)
)

function statusColor(status) {
	const s = status.toLowerCase()
	if (/reject|cancel/.test(s)) return "#B91C1C"
	if (/pending|open|draft|unpaid/.test(s)) return "#B45309"
	if (/approv|submit|active|paid|claimed/.test(s)) return "#047857"
	return "#1D4ED8"
}
</script>
