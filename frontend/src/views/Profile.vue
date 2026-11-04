<template>
	<ion-page>
		<ion-content class="ion-no-padding">
			<div class="flex flex-col min-h-full w-full bg-page">
				<PageHeader :title="__('My Profile')">
					<template #actions>
						<router-link
							:to="{ name: 'Settings' }"
							class="flex items-center justify-center h-9 w-9 rounded-full bg-white text-ink"
							:aria-label="__('Settings')"
						>
							<FeatherIcon name="settings" class="h-[18px] w-[18px]" />
						</router-link>
					</template>
				</PageHeader>

				<div class="flex flex-col px-4 pb-10">
					<!-- Profile header -->
					<div class="flex flex-col items-center pt-4">
						<img
							v-if="user.data.user_image"
							class="h-24 w-24 rounded-full object-cover shadow-md"
							:src="user.data.user_image"
							:alt="user.data.first_name"
						/>
						<div
							v-else
							class="flex items-center justify-center h-24 w-24 rounded-full text-[34px] font-semibold uppercase text-white shadow-md bg-gradient-to-br from-[#11855F] to-brand"
						>
							{{ initials }}
						</div>
						<div class="mt-3 font-heading text-[22px] font-bold text-ink text-center tracking-tight">
							{{ employee?.data?.employee_name }}
						</div>
						<div v-if="employee?.data?.designation" class="text-[15px] text-ink-subtle text-center">
							{{ employee.data.designation }}
						</div>
					</div>

					<!-- Detail groups shown inline, label above value -->
					<template v-for="section in profileLinks" :key="section.title">
						<SectionHeader :title="section.title" />
						<div class="bg-white rounded-card overflow-hidden">
							<div
								v-if="!employeeDoc.doc || !employeeDocType.data"
								class="flex flex-col gap-2 px-4 py-3"
							>
								<div class="h-3 w-24 rounded bg-gray-100 animate-pulse"></div>
								<div class="h-4 w-40 rounded bg-gray-100 animate-pulse"></div>
							</div>
							<template v-else v-for="(field, index) in section.fields" :key="field">
								<div class="flex flex-col gap-0.5 px-4 py-2.5">
									<span class="text-[13px] text-ink-subtle">{{ getFieldInfo(field)[0] }}</span>
									<FormattedField
										:value="getFieldValue(field)"
										:fieldtype="getFieldInfo(field)[1]"
										:fieldname="field"
									/>
								</div>
								<div v-if="index < section.fields.length - 1" class="ml-4 h-px bg-gray-200/60"></div>
							</template>
						</div>
					</template>
					<p class="px-4 pt-2 text-[13px] text-ink-subtle">
						{{ __("Employment details are managed by HR.") }}
					</p>

					<button
						class="flex flex-row items-center justify-center gap-2 w-full mt-8 py-3.5 rounded-full bg-red-50 text-red-700 text-[17px] font-semibold active:scale-[0.97] transition-transform"
						@click="logout"
					>
						<FeatherIcon name="log-out" class="h-[18px] w-[18px]" />
						{{ __("Log Out") }}
					</button>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { computed, inject, ref, watch, onMounted, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, createDocumentResource, createResource, toast } from "frappe-ui"

import { showErrorAlert } from "@/utils/dialogs"
import { formatCurrency } from "@/utils/formatters"

import PageHeader from "@/components/PageHeader.vue"
import SectionHeader from "@/components/SectionHeader.vue"
import FormattedField from "@/components/FormattedField.vue"

import { arePushNotificationsEnabled } from "@/data/notifications"

const DOCTYPE = "Employee"

const socket = inject("$socket")
const session = inject("$session")
const user = inject("$user")
const employee = inject("$employee")
const __ = inject("$translate")

const router = useRouter()

const profileLinks = [
	{
		icon: "user",
		title: __("Employee Details"),
		fields: [
			"employee_name",
			"employee_number",
			"gender",
			"date_of_birth",
			"date_of_joining",
			"blood_group",
		],
	},
	{
		icon: "file",
		title: __("Company Information"),
		fields: [
			"company",
			"department",
			"designation",
			"branch",
			"grade",
			"reports_to",
			"employment_type",
		],
	},
	{
		icon: "book",
		title: __("Contact Information"),
		fields: [
			"cell_number",
			"personal_email",
			"company_email",
			"preferred_email",
		],
	},
	{
		icon: "dollar-sign",
		title: __("Salary Information"),
		fields: [
			"ctc",
			"payroll_cost_center",
			"pan_number",
			"provident_fund_account",
			"salary_mode",
			"bank_name",
			"bank_ac_no",
			"ifsc_code",
			"micr_code",
			"iban",
		],
	},
]

const initials = computed(() =>
	(employee?.data?.employee_name || user.data.first_name || "")
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
)

const allowPushNotifications = computed(
	() =>
		window.frappe?.boot.push_relay_server_url &&
		arePushNotificationsEnabled.data
)


const employeeDoc = createDocumentResource({
	doctype: DOCTYPE,
	name: employee.data.name,
	fields: "*",
	auto: true,
	transform: (data) => {
		data.ctc = formatCurrency(data.ctc, data.salary_currency)
		return data
	},
})

const reportsToName = createResource({
	url: "hrms.api.get_reports_to_employee_name",
})

watch(
	() => employeeDoc.doc?.reports_to,
	(reports_to) => {
		if (reports_to) {
			reportsToName.submit({ employee: reports_to })
		}
	}
)

const employeeDocType = createResource({
	url: "hrms.api.get_doctype_fields",
	params: { doctype: DOCTYPE },
	auto: true,
})

const getFieldInfo = (fieldname) => {
	const field = employeeDocType.data.find(
		(field) => field.fieldname === fieldname
	)
	return [__(field?.label, null, "Employee"), field?.fieldtype]
}

const getFieldValue = (fieldname) => {
	if (fieldname === "employee_number" && !employeeDoc.doc[fieldname]) {
		return employeeDoc.doc["name"]
	}
	if (fieldname === "reports_to") {
		return reportsToName.data || employeeDoc.doc[fieldname]
	}
	return employeeDoc.doc[fieldname]
}

const logout = async () => {
	try {
		await session.logout.submit()
	} catch (e) {
		const msg = "An error occurred while attempting to log out!"
		console.error(msg, e)
		showErrorAlert(msg)
	}
}



onMounted(() => {
	socket.emit("doctype_subscribe", DOCTYPE)
	socket.on("list_update", (data) => {
		if (data.doctype === DOCTYPE && data.name === employee.data.name) {
			employeeDoc.reload()
		}
	})
})

onBeforeUnmount(() => {
	socket.emit("doctype_unsubscribe", DOCTYPE)
	socket.off("list_update")
})
</script>
