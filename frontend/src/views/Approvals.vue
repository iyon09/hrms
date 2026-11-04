<template>
	<ion-page>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col min-h-full w-full bg-page">
				<PageHeader :title="__('Approvals')">
					<template #actions>
						<button
							class="flex items-center justify-center h-9 w-9 rounded-full text-brand active:bg-gray-900/[0.06]"
							:aria-label="__('Refresh')"
							@click="reload"
						>
							<FeatherIcon name="refresh-cw" class="h-[18px] w-[18px]" :class="approvals.loading && 'animate-spin'" />
						</button>
					</template>
				</PageHeader>

				<!-- request types, like the Flutter Approvals tabs -->
				<div class="flex flex-row gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
					<button
						v-for="tab in tabs"
						:key="tab.key"
						class="flex flex-row items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors"
						:class="tab.key === activeTab?.key ? 'bg-brand text-white' : 'bg-white text-ink-muted'"
						@click="activeKey = tab.key"
					>
						{{ __(tab.label) }}
						<span
							v-if="tab.count"
							class="min-w-[20px] rounded-full px-1.5 text-[12px] leading-5 text-center"
							:class="tab.key === activeTab?.key ? 'bg-white/25 text-white' : 'bg-red-500 text-white'"
						>
							{{ tab.count > 99 ? "99+" : tab.count }}
						</span>
					</button>
				</div>

				<div class="flex flex-col px-4 pb-10">
					<TabButtons
						class="mt-3"
						:buttons="[
							{ key: 'pending', label: __('Pending') },
							{ key: 'history', label: __('History') },
						]"
						v-model="view"
					/>

					<!-- every request previewed in full, so it can be decided without opening it -->
					<template v-if="view === 'pending'">
						<template v-if="activeTab?.sections.length">
							<template v-for="section in activeTab.sections" :key="section.state">
								<SectionHeader :title="stageTitle(section.state)">
									<template #trailing>
										<span class="text-[13px] font-semibold text-ink-subtle">{{ section.items.length }}</span>
									</template>
								</SectionHeader>
								<div class="flex flex-col gap-3">
									<ApprovalCard
										v-for="item in section.items"
										:key="item.name"
										:item="item"
										:tab="activeTab"
										:busyAction="busy?.name === item.name ? busy.action : null"
										@action="(action) => submit(item, action)"
										@reject="startReject(item)"
										@preview="openPreview"
									/>
								</div>
							</template>
						</template>
						<div v-else-if="approvals.loading && !approvals.data" class="w-full h-64 mt-4 bg-white rounded-card animate-pulse"></div>
						<EmptyState v-else :message="__('Nothing waiting for you here')" />
					</template>

					<template v-else>
						<div v-if="history.data?.length" class="w-full bg-white rounded-card overflow-hidden mt-4">
							<template v-for="(item, index) in history.data" :key="item.name">
								<ApprovalRow :item="item" :tab="activeTab" :showState="true" @click="openHistory(item)" />
								<div v-if="index < history.data.length - 1" class="ml-[60px] h-px bg-gray-200/60"></div>
							</template>
						</div>
						<div v-else-if="history.loading" class="w-full h-40 mt-4 bg-white rounded-card animate-pulse"></div>
						<EmptyState v-else :message="__('No decisions yet')" />
					</template>
				</div>
			</div>

			<!-- reject reason, or a past decision's preview -->
			<ion-modal :is-open="!!selected" :initial-breakpoint="1" :breakpoints="[0, 1]" @didDismiss="selected = null">
				<div v-if="selected" class="flex flex-col gap-4 max-h-[85vh] overflow-y-auto p-4 pb-8 bg-page">
					<template v-if="rejecting">
						<div class="flex flex-col mt-2">
							<span class="font-heading text-[18px] font-semibold text-ink">{{ __("Reject request") }}</span>
							<span class="text-[13px] text-ink-subtle">
								{{ selected.employee_name }} · {{ selected.summary }}
							</span>
						</div>
						<div class="app-field flex flex-col gap-2 bg-white rounded-card p-4">
							<span class="px-1 text-[13px] font-medium text-ink-subtle after:content-['_*'] after:text-red-600">
								{{ __("Reason for rejecting") }}
							</span>
							<textarea
								v-model="reason"
								rows="3"
								class="form-textarea w-full"
								:placeholder="__('e.g. Dates clash with an approved request')"
							></textarea>
						</div>
						<Button
							variant="solid"
							class="w-full py-6 !rounded-full !bg-red-600 hover:!bg-red-700 text-[17px] font-semibold"
							:disabled="!reason.trim()"
							:loading="busy?.action === 'Reject'"
							@click="submit(selected, 'Reject')"
						>
							{{ __("Confirm Reject") }}
						</Button>
					</template>
					<template v-else>
						<div class="flex flex-row items-center justify-between mt-2 px-1">
							<span class="font-heading text-[18px] font-semibold text-ink">{{ __(selected.doctype) }}</span>
							<span class="text-[15px] font-semibold" :class="/approv/i.test(selected.state) ? 'text-[#047857]' : 'text-[#B91C1C]'">
								{{ __(selected.state) }}
							</span>
						</div>
						<ApprovalCard :item="selected" :tab="activeTab" @preview="openPreview" />
					</template>
				</div>
			</ion-modal>

			<!-- full-screen image preview -->
			<ion-modal :is-open="!!previewImage" @didDismiss="previewImage = null">
				<div class="relative flex items-center justify-center h-full w-full bg-black" @click="previewImage = null">
					<img v-if="previewImage" :src="previewImage.url" :alt="previewImage.name" class="max-h-full max-w-full object-contain" />
					<button
						class="absolute top-4 right-4 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 text-white standalone:mt-safe-top"
						:aria-label="__('Close')"
					>
						<FeatherIcon name="x" class="h-5 w-5" />
					</button>
					<a
						v-if="previewImage"
						:href="previewImage.url"
						target="_blank"
						class="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-4 py-2 text-[14px] font-semibold text-white"
						@click.stop
					>
						{{ __("Open original") }}
					</a>
				</div>
			</ion-modal>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { computed, inject, ref, watch } from "vue"
import { IonPage, IonContent, IonModal } from "@ionic/vue"
import { Button, FeatherIcon, createResource, toast } from "frappe-ui"

import PageHeader from "@/components/PageHeader.vue"
import SectionHeader from "@/components/SectionHeader.vue"
import TabButtons from "@/components/TabButtons.vue"
import EmptyState from "@/components/EmptyState.vue"
import ApprovalCard from "@/components/ApprovalCard.vue"
import ApprovalRow from "@/components/ApprovalRow.vue"

import { approvals } from "@/data/approvals"

const __ = inject("$translate")

const activeKey = ref(null)
const view = ref("pending")
const selected = ref(null)
const rejecting = ref(false)
const reason = ref("")
const busy = ref(null)
const previewImage = ref(null)

const tabs = computed(() => approvals.data || [])
const activeTab = computed(() => tabs.value.find((tab) => tab.key === activeKey.value) || tabs.value[0])

// open on the first type that has something waiting
watch(
	tabs,
	(value) => {
		if (!activeKey.value && value.length) activeKey.value = (value.find((tab) => tab.count) || value[0]).key
	},
	{ immediate: true }
)

const history = createResource({
	url: "hse_management.approvals.get_approval_history",
	makeParams: () => ({ doctype: activeTab.value?.doctype }),
})

watch([view, activeKey], () => {
	if (view.value === "history" && activeTab.value) history.reload()
})

const STAGE_TITLES = {
	Pending: __("New Requests"),
	Draft: __("New Requests"),
	"Acknowledged By Supervisor": __("Acknowledged by Supervisor"),
	"Acknowledged by HR": __("Acknowledged by HR"),
}
const stageTitle = (state) => STAGE_TITLES[state] || __(state)

function startReject(item) {
	selected.value = item
	rejecting.value = true
	reason.value = ""
}

function openHistory(item) {
	selected.value = item
	rejecting.value = false
}

function openPreview(file) {
	if (/\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(file.url)) previewImage.value = file
	else window.open(file.url, "_blank")
}

function reload() {
	approvals.reload()
	if (view.value === "history") history.reload()
}

const showToast = (title, text, success = true) =>
	toast({
		title,
		text,
		icon: success ? "check-circle" : "alert-circle",
		position: "bottom-center",
		iconClasses: success ? "text-green-500" : "text-red-500",
	})

const applyAction = createResource({
	url: "hse_management.approvals.apply_approval_action",
	method: "POST",
})

async function submit(item, action) {
	busy.value = { name: item.name, action }
	try {
		const data = await applyAction.submit({
			doctype: item.doctype,
			name: item.name,
			action,
			reason: action === "Reject" ? reason.value : undefined,
		})
		showToast(__("Done"), __("{0} is now {1}", [data.name, __(data.state)]))
		selected.value = null
		await approvals.reload()
	} catch (error) {
		showToast(__("Error"), error.messages?.[0] || error.message, false)
	} finally {
		busy.value = null
	}
}

approvals.reload()
</script>
