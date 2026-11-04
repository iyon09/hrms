<template>
	<header
		class="flex flex-row items-center gap-1 px-3 py-3 bg-page/90 backdrop-blur-md sticky top-0 z-[1000] standalone:pt-safe-top"
	>
		<button
			class="flex items-center justify-center h-9 w-9 shrink-0 rounded-full text-brand active:bg-gray-900/[0.06]"
			:aria-label="__('Back')"
			@click="router.back()"
		>
			<FeatherIcon name="chevron-left" class="h-6 w-6" />
		</button>
		<h2 class="grow min-w-0 text-[17px] font-semibold text-ink truncate">{{ title }}</h2>
		<div class="flex flex-row items-center gap-2 shrink-0">
			<slot name="actions" />
		</div>
	</header>
</template>

<script setup>
import { inject } from "vue"
import { useRouter } from "vue-router"
import { FeatherIcon } from "frappe-ui"

defineProps({
	title: {
		type: String,
		required: true,
	},
})

const __ = inject("$translate")
const router = useRouter()
</script>
