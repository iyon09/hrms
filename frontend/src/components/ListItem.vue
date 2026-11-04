<template>
	<div class="flex flex-col w-full justify-center gap-2.5">
		<div class="flex flex-row items-center justify-between">
			<div class="flex flex-row items-center gap-3.5 grow min-w-0">
				<slot name="left" />
			</div>
			<div class="flex flex-row justify-end items-center gap-2">
				<slot name="right" />
			</div>
		</div>
		<div v-if="props.isTeamRequest" class="flex flex-row items-center gap-2 pl-[44px]">
			<EmployeeAvatar :employeeID="props.employee" />
			<div class="text-[13px] text-ink-subtle grow">
				{{ props.employeeName }}
			</div>
		</div>
	</div>
</template>

<script setup>
import EmployeeAvatar from "@/components/EmployeeAvatar.vue"

const props = defineProps({
	isTeamRequest: {
		type: Boolean,
		default: false,
	},
	employee: {
		type: String,
		required: false,
	},
	employeeName: {
		type: String,
		required: false,
	},
})
</script>
