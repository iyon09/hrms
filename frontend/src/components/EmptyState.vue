<template>
	<div
		class="flex flex-col items-center rounded-card p-5 text-[15px] text-ink-subtle"
		:class="[
			props.isTableField ? 'border-2 border-dashed border-gray-300 mt-5' : 'bg-white mt-4',
		]"
	>
		{{ __(props.message) }}
	</div>
</template>

<script setup>
const props = defineProps({
	message: { type: String },
	isTableField: { type: Boolean, default: false },
})
</script>
