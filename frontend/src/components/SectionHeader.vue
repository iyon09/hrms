<template>
	<div class="flex flex-row items-center w-full px-1 pt-7 pb-2.5">
		<div class="grow font-heading text-xl font-bold text-ink">{{ title }}</div>
		<slot name="trailing" />
	</div>
</template>

<script setup>
defineProps({
	title: {
		type: String,
		required: true,
	},
})
</script>
