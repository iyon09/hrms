<template>
	<div class="flex flex-col w-full bg-white rounded-card overflow-hidden">
		<!-- who and what -->
		<div class="flex flex-row items-center gap-3 px-4 pt-4">
			<IconTile :icon="tab.icon" :color="tab.color" />
			<div class="flex flex-col grow min-w-0">
				<span class="text-[16px] font-semibold text-ink truncate">{{ item.employee_name }}</span>
				<span class="text-[12px] text-ink-subtle truncate">{{ item.name }}</span>
			</div>
			<router-link
				v-if="item.route"
				:to="{ name: item.route, params: { id: item.name } }"
				class="flex items-center justify-center h-8 w-8 rounded-full text-ink-faint active:bg-gray-100 shrink-0"
				:aria-label="__('Open full details')"
			>
				<FeatherIcon name="external-link" class="h-4 w-4" />
			</router-link>
		</div>

		<div class="px-4 pt-2 text-[15px] font-medium text-ink">{{ item.summary }}</div>

		<!-- key fields -->
		<div v-if="item.details?.length" class="flex flex-col gap-1.5 px-4 pt-3">
			<div
				v-for="detail in item.details || []"
				:key="detail.label"
				class="flex gap-x-3"
				:class="detail.value.length > 28 ? 'flex-col' : 'flex-row justify-between'"
			>
				<span class="text-[13px] text-ink-subtle shrink-0">{{ detail.label }}</span>
				<span
					class="text-[13px] text-ink whitespace-pre-line break-words"
					:class="detail.value.length <= 28 ? 'text-right' : 'line-clamp-4'"
				>
					{{ detail.value }}
				</span>
			</div>
		</div>

		<!-- claim expenses / overtime crew -->
		<div v-if="item.lines?.length" class="mx-4 mt-3 rounded-xl bg-[#F1F3F6] overflow-hidden">
			<template v-for="(line, index) in item.lines" :key="index">
				<div class="flex flex-row items-center gap-3 px-3 py-2">
					<div class="flex flex-col grow min-w-0">
						<span class="text-[14px] font-medium text-ink truncate">{{ line.title }}</span>
						<span v-if="line.subtitle" class="text-[12px] text-ink-subtle line-clamp-2">{{ line.subtitle }}</span>
					</div>
					<span class="text-[14px] font-semibold text-ink shrink-0">{{ line.value }}</span>
				</div>
				<div v-if="index < (item.lines || []).length - 1" class="mx-3 h-px bg-gray-200"></div>
			</template>
		</div>

		<!-- receipts, MCs, photos -->
		<div v-if="item.attachments?.length" class="flex flex-row gap-2 overflow-x-auto px-4 pt-3 no-scrollbar">
			<button
				v-for="file in item.attachments"
				:key="file.url"
				class="shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-[#F1F3F6] active:opacity-70"
				@click="$emit('preview', file)"
			>
				<img
					v-if="isImage(file)"
					:src="file.url"
					:alt="file.name"
					loading="lazy"
					class="h-20 w-20 object-cover"
				/>
				<div v-else class="flex flex-col items-center justify-center gap-1 h-20 w-20 px-1.5">
					<FeatherIcon name="file-text" class="h-6 w-6 text-[#B91C1C]" />
					<span class="w-full text-[10px] leading-3 text-ink-muted line-clamp-2 break-all">{{ file.name }}</span>
				</div>
			</button>
		</div>

		<!-- decide right here -->
		<div v-if="item.actions?.length" class="flex flex-row gap-2 p-4">
			<Button
				v-if="item.actions.includes('Reject')"
				class="flex-1 py-5 !rounded-full !bg-red-50 !text-red-600 text-[15px] font-semibold"
				:disabled="!!busyAction"
				@click="$emit('reject')"
			>
				{{ __("Reject") }}
			</Button>
			<Button
				v-for="action in item.actions.filter((action) => action !== 'Reject')"
				:key="action"
				variant="solid"
				class="flex-1 py-5 !rounded-full !bg-brand hover:!bg-brand-strong text-[15px] font-semibold"
				:loading="busyAction === action"
				:disabled="!!busyAction && busyAction !== action"
				@click="$emit('action', action)"
			>
				{{ __(action === "Acknowledged" ? "Acknowledge" : action) }}
			</Button>
		</div>
		<div v-else class="pb-4"></div>
	</div>
</template>

<script setup>
import { Button, FeatherIcon } from "frappe-ui"

import IconTile from "@/components/IconTile.vue"

defineProps({
	item: { type: Object, required: true },
	tab: { type: Object, required: true },
	// the action being sent for this card, if any
	busyAction: { type: String, default: null },
})

defineEmits(["action", "reject", "preview"])

const isImage = (file) => /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(file.url)
</script>
