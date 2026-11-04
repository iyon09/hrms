<template>
	<ion-header class="ion-no-border">
		<PageHeader :title="pageTitle">
			<template #actions>
				<button
					id="show-filter-modal"
					class="flex items-center justify-center h-9 w-9 rounded-full transition-colors"
					:class="areFiltersApplied ? 'bg-brand text-white' : 'bg-white text-ink'"
					:aria-label="__('Filter')"
				>
					<FeatherIcon name="filter" class="h-[18px] w-[18px]" />
				</button>
				<router-link
					v-if="createPermission?.data?.has_permission && props.doctype != 'Employee Checkin'"
					:to="{ name: formViewRoute }"
					class="flex flex-row items-center gap-1 h-9 pl-3 pr-3.5 rounded-full bg-brand text-white text-[15px] font-semibold active:scale-95 transition-transform"
				>
					<FeatherIcon name="plus" class="h-4 w-4" />
					{{ __("New", null, props.doctype) }}
				</router-link>
			</template>
		</PageHeader>
	</ion-header>

	<ion-content>
		<ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
			<ion-refresher-content></ion-refresher-content>
		</ion-refresher>

		<div
			class="flex flex-col items-center pb-7 px-4 pt-1 h-full w-full overflow-y-auto bg-page"
			ref="scrollContainer"
			@scroll="() => handleScroll()"
		>
			<div class="w-full">
				<TabButtons
					v-if="props.tabButtons"
					class="mt-2"
					:buttons="props.tabButtons"
					v-model="activeTab"
				/>

				<div
					class="flex flex-col bg-white rounded-card overflow-hidden mt-4"
					v-if="!documents.loading && documents.data?.length"
				>
					<div
						class="px-4 py-3.5 items-center justify-between border-b border-gray-200/60 last:border-b-0 cursor-pointer active:bg-gray-100 transition-colors"
						v-for="link in documents.data"
						:key="link.name"
					>
						<component
							v-if="props.doctype === 'Employee Checkin'"
							:is="listItemComponent[doctype]"
							:doc="link"
							:isTeamRequest="isTeamRequest"
							:workflowStateField="workflowStateField"
							@click="openRequestModal(link)"
						/>
						<router-link
							v-else
							:to="{ name: detailViewRoute, params: { id: link.name } }"
							v-slot="{ navigate }"
						>
							<component
								:is="listItemComponent[doctype]"
								:doc="link"
								:isTeamRequest="isTeamRequest"
								:workflowStateField="workflowStateField"
								@click="navigate"
							/>
						</router-link>
					</div>
				</div>
				<EmptyState
					:message="__('No {0} found', [props.doctype?.toLowerCase()])"
					v-else-if="!documents.loading"
				/>

				<!-- Loading Indicator -->
				<div v-if="documents.loading" class="flex mt-2 items-center justify-center">
					<LoadingIndicator class="w-8 h-8 text-brand" />
				</div>
			</div>
		</div>

		<CustomIonModal trigger="show-filter-modal">
			<!-- Filter Action Sheet -->
			<template #actionSheet>
				<ListFiltersActionSheet
					:filterConfig="filterConfig"
					@applyFilters="applyFilters"
					@clearFilters="clearFilters"
					v-model:filters="filterMap"
				/>
			</template>
		</CustomIonModal>
	</ion-content>

	<ion-modal
		ref="modal"
		:is-open="isRequestModalOpen"
		@didDismiss="closeRequestModal"
		:initial-breakpoint="1"
		:breakpoints="[0, 1]"
	>
		<RequestActionSheet
			:fields="EMPLOYEE_CHECKIN_FIELDS"
			:showOpenForm="false"
			v-model="selectedRequest"
		/>
	</ion-modal>
</template>

<script setup>
import PageHeader from "@/components/PageHeader.vue"
import { useRouter } from "vue-router"
import { inject, ref, markRaw, watch, computed, reactive, onMounted } from "vue"
import {
	modalController,
	IonHeader,
	IonContent,
	IonModal,
	IonRefresher,
	IonRefresherContent,
} from "@ionic/vue"

import { FeatherIcon, createResource, LoadingIndicator, debounce } from "frappe-ui"

import TabButtons from "@/components/TabButtons.vue"
import EmployeeCheckinItem from "@/components/EmployeeCheckinItem.vue"
import AttendanceRequestItem from "@/components/AttendanceRequestItem.vue"
import ShiftRequestItem from "@/components/ShiftRequestItem.vue"
import ShiftAssignmentItem from "@/components/ShiftAssignmentItem.vue"
import LeaveRequestItem from "@/components/LeaveRequestItem.vue"
import ExpenseClaimItem from "@/components/ExpenseClaimItem.vue"
import EmployeeAdvanceItem from "@/components/EmployeeAdvanceItem.vue"
import ListFiltersActionSheet from "@/components/ListFiltersActionSheet.vue"
import CustomIonModal from "@/components/CustomIonModal.vue"
import RequestActionSheet from "@/components/RequestActionSheet.vue"
import { EMPLOYEE_CHECKIN_FIELDS } from "@/data/config/requestSummaryFields"

import useWorkflow from "@/composables/workflow"
import { useListUpdate } from "@/composables/realtime"

const __ = inject("$translate")
const props = defineProps({
	doctype: {
		type: String,
		required: true,
	},
	fields: {
		type: Array,
		required: true,
	},
	groupBy: {
		type: String,
		required: false,
	},
	filterConfig: {
		type: Array,
		required: true,
	},
	tabButtons: {
		type: Array,
		required: false,
	},
	pageTitle: {
		type: String,
		required: true,
	},
})

const getButtonKey = (tab) => tab?.key ?? tab

const listItemComponent = {
	"Employee Checkin": markRaw(EmployeeCheckinItem),
	"Attendance Request": markRaw(AttendanceRequestItem),
	"Shift Request": markRaw(ShiftRequestItem),
	"Shift Assignment": markRaw(ShiftAssignmentItem),
	"Leave Application": markRaw(LeaveRequestItem),
	"Expense Claim": markRaw(ExpenseClaimItem),
	"Employee Advance": markRaw(EmployeeAdvanceItem),
}

const router = useRouter()
const dayjs = inject("$dayjs")
const socket = inject("$socket")
const employee = inject("$employee")
const filterMap = reactive({})
const activeTab = ref(props.tabButtons ? getButtonKey(props.tabButtons[0]) : undefined)
const areFiltersApplied = ref(false)
const appliedFilters = ref([])
const workflowStateField = ref(null)
const isRequestModalOpen = ref(false)
const selectedRequest = ref(null)

// infinite scroll
const scrollContainer = ref(null)
const hasNextPage = ref(true)
const listOptions = ref({
	doctype: props.doctype,
	fields: props.fields,
	group_by: props.groupBy,
	order_by: `\`tab${props.doctype}\`.modified desc`,
	page_length: 50,
})

// computed properties
const isTeamRequest = computed(() => {
	return props.tabButtons && activeTab.value === getButtonKey(props.tabButtons[1])
})

const formViewRoute = computed(() => {
	return `${props.doctype.replace(/\s+/g, "")}FormView`
})

const detailViewRoute = computed(() => {
	return `${props.doctype.replace(/\s+/g, "")}DetailView`
})

const defaultFilters = computed(() => {
	const filters = []

	if (isTeamRequest.value) {
		filters.push([props.doctype, "employee", "!=", employee.data.name])
	} else {
		filters.push([props.doctype, "employee", "=", employee.data.name])
	}

	return filters
})

// resources
const documents = createResource({
	url: "frappe.desk.reportview.get",
	onSuccess: (data) => {
		if (data.values?.length < listOptions.value.page_length) {
			hasNextPage.value = false
		}
	},
	transform(data) {
		if (data.length === 0) {
			return []
		}

		// convert keys and values arrays to docs object
		const fields = data["keys"]
		const values = data["values"]
		const docs = values.map((value) => {
			const doc = {}
			fields.forEach((field, index) => {
				doc[field] = value[index]
			})
			return doc
		})

		let pagedData
		if (!documents.params.start || documents.params.start === 0) {
			pagedData = docs
		} else {
			pagedData = documents.data.concat(docs)
		}

		return pagedData
	},
})

const createPermission = createResource({
	url: "frappe.client.has_permission",
	params: { doctype: props.doctype, docname: "", perm_type: "create" },
	auto: true,
})

// helper functions
const openRequestModal = async (request) => {
	selectedRequest.value = request
	selectedRequest.value.doctype = "Employee Checkin"
	selectedRequest.value.date = request.time
	selectedRequest.value.formatted_time = dayjs(request.time).format("HH:mm a")
	selectedRequest.value.formatted_latitude = `${Number(request.latitude).toFixed(5)}°`
	selectedRequest.value.formatted_longitude = `${Number(request.longitude).toFixed(5)}°`
	isRequestModalOpen.value = true
}

const closeRequestModal = async () => {
	isRequestModalOpen.value = false
	selectedRequest.value = null
}

function initializeFilters() {
	props.filterConfig.forEach((filter) => {
		filterMap[filter.fieldname] = {
			condition: "=",
			value: null,
		}
	})

	appliedFilters.value = []
}
initializeFilters()

function prepareFilters() {
	let condition = ""
	let value = ""
	appliedFilters.value = []

	for (const fieldname in filterMap) {
		condition = filterMap[fieldname].condition
		// accessing .value because autocomplete returns an object instead of value
		if (typeof condition === "object" && condition !== null) {
			condition = condition.value
		}

		value = filterMap[fieldname].value
		if (condition && value) appliedFilters.value.push([props.doctype, fieldname, condition, value])
	}
}

function applyFilters() {
	prepareFilters()
	fetchDocumentList()
	modalController.dismiss()
	areFiltersApplied.value = appliedFilters.value.length ? true : false
}

function clearFilters() {
	initializeFilters()
	fetchDocumentList()
	modalController.dismiss()
	areFiltersApplied.value = false
}

function fetchDocumentList(start = 0) {
	if (start === 0) {
		hasNextPage.value = true
	}

	const filters = [[props.doctype, "docstatus", "!=", "2"]]
	filters.push(...defaultFilters.value)

	if (appliedFilters.value) filters.push(...appliedFilters.value)

	if (workflowStateField.value) {
		listOptions.value.fields.push(workflowStateField.value)
	}

	documents.submit({
		...listOptions.value,
		start: start || 0,
		filters: filters,
	})
}

const handleScroll = debounce(() => {
	if (!hasNextPage.value) return

	const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
	const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100

	if (scrollPercentage >= 90) {
		const start = documents.params.start + listOptions.value.page_length
		fetchDocumentList(start)
	}
}, 500)

const handleRefresh = (event) => {
	setTimeout(() => {
		fetchDocumentList()
		event.target.complete()
	}, 500)
}

watch(
	() => activeTab.value,
	(_value) => {
		fetchDocumentList()
	}
)

onMounted(async () => {
	const workflow = useWorkflow(props.doctype)
	await workflow.workflowDoc.promise
	workflowStateField.value = workflow.getWorkflowStateField()
	fetchDocumentList()

	useListUpdate(socket, props.doctype, () => fetchDocumentList())
})
</script>
