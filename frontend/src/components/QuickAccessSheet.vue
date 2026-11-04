<template>
	<ion-modal
		:is-open="isOpen"
		:initial-breakpoint="1"
		:breakpoints="[0, 1]"
		@didDismiss="emit('close')"
	>
		<div class="flex flex-col bg-page px-4 pt-5 pb-8 standalone:pb-safe-bottom">
			<div class="flex flex-row items-center justify-between px-1 mb-1">
				<h2 class="font-heading text-2xl font-bold text-ink">{{ __("Quick Access") }}</h2>
				<button
					class="flex items-center justify-center h-8 w-8 rounded-full bg-gray-900/[0.07] text-ink-muted"
					:aria-label="__('Close')"
					@click="emit('close')"
				>
					<FeatherIcon name="x" class="h-4 w-4" />
				</button>
			</div>

			<template v-for="section in sections" :key="section.title">
				<div class="px-1 mt-5 mb-2 text-[13px] font-semibold text-ink-subtle">
					{{ section.title }}
				</div>
				<div class="grid grid-cols-4 gap-y-4 gap-x-2 bg-white rounded-card px-3 py-4">
					<button
						v-for="item in section.items"
						:key="item.route"
						class="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
						@click="open(item.route)"
					>
						<IconTile :icon="item.icon" :color="section.color" size="lg" />
						<span class="text-xs font-medium text-ink text-center leading-tight">
							{{ item.label }}
						</span>
					</button>
				</div>
			</template>
		</div>
	</ion-modal>
</template>

<script setup>
import { inject } from "vue"
import { useRouter } from "vue-router"
import { IonModal } from "@ionic/vue"
import { FeatherIcon } from "frappe-ui"

import IconTile from "@/components/IconTile.vue"

defineProps({
	isOpen: {
		type: Boolean,
		default: false,
	},
})
const emit = defineEmits(["close"])

const __ = inject("$translate")
const router = useRouter()

// one hue per group, so related modules read as a family
const sections = [
	{
		title: __("Time & attendance"),
		color: "#0E9F6E",
		items: [
			{ label: __("Check-ins"), icon: "map-pin", route: "EmployeeCheckinListView" },
			{ label: __("Attendance"), icon: "check-square", route: "AttendanceRequestListView" },
			{ label: __("Shift Request"), icon: "clock", route: "ShiftRequestListView" },
			{ label: __("My Shifts"), icon: "calendar", route: "ShiftAssignmentListView" },
			{ label: __("Overtime"), icon: "watch", route: "OvertimeSlipListView" },
		],
	},
	{
		title: __("Leave & money"),
		color: "#F08A24",
		items: [
			{ label: __("Leave"), icon: "sun", route: "LeaveApplicationListView" },
			{ label: __("Expense"), icon: "file-text", route: "ExpenseClaimListView" },
			{ label: __("Advance"), icon: "dollar-sign", route: "EmployeeAdvanceListView" },
			{ label: __("Salary Slip"), icon: "credit-card", route: "SalarySlipsDashboard" },
		],
	},
	{
		title: __("Account"),
		color: "#5B6CF0",
		items: [
			{ label: __("Approvals"), icon: "check-circle", route: "Approvals" },
			{ label: __("Profile"), icon: "user", route: "Profile" },
			{ label: __("Notifications"), icon: "bell", route: "Notifications" },
			{ label: __("Settings"), icon: "settings", route: "Settings" },
			{ label: __("Password"), icon: "lock", route: "ChangePassword" },
		],
	},
]

function open(route) {
	emit("close")
	router.push({ name: route })
}
</script>
