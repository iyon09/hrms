<template>
	<div class="flex p-1 bg-gray-900/[0.06] rounded-full">
		<button
			v-for="button in buttons"
			:key="button.key ?? button.label ?? button"
			class="px-4 py-2 transition-all rounded-full flex-auto font-semibold text-[15px]"
			:class="
				modelValue === (button.key ?? button.label ?? button)
					? 'bg-white shadow-sm text-brand'
					: 'text-ink-subtle'
			"
			@click="$emit('update:modelValue', button.key ?? button.label ?? button)"
		>
			{{ button.label ?? __(button) }}
		</button>
	</div>
</template>

<script setup>
const props = defineProps({
	buttons: {
		type: Array,
		required: true,
	},
	modelValue: {
		type: String,
	},
})

defineEmits(["update:modelValue"])
</script>
