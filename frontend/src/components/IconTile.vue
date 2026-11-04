<template>
	<div
		class="flex items-center justify-center shrink-0 text-white"
		:class="size === 'lg' ? 'h-[54px] w-[54px] rounded-[14px]' : 'h-[30px] w-[30px] rounded-lg'"
		:style="{ background: `linear-gradient(to bottom, ${lighten(color)}, ${color})` }"
	>
		<FeatherIcon :name="icon" :class="size === 'lg' ? 'h-6 w-6' : 'h-[18px] w-[18px]'" />
	</div>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui"

defineProps({
	icon: {
		type: String,
		required: true,
	},
	color: {
		type: String,
		default: "#64748B",
	},
	size: {
		type: String,
		default: "sm",
	},
})

// soft top-to-bottom sheen, like an app icon
function lighten(hex) {
	const n = parseInt(hex.slice(1), 16)
	const mix = (c) => Math.round(c + (255 - c) * 0.14)
	const [r, g, b] = [mix(n >> 16), mix((n >> 8) & 255), mix(n & 255)]
	return `rgb(${r}, ${g}, ${b})`
}
</script>
