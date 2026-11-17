<template>
	<div class="flex flex-col bg-white rounded-card w-full px-5 pt-[18px] pb-5">
		<div class="flex flex-row items-center gap-1.5 text-[13px] font-semibold text-ink-subtle">
			<FeatherIcon name="clock" class="h-[15px] w-[15px]" :class="isCheckedIn && 'text-brand'" />
			<span class="grow">{{ dayjs().format("dddd, D MMMM") }}</span>
			<router-link
				v-if="settings.data?.allow_employee_checkin_from_mobile_app"
				:to="{ name: 'EmployeeCheckinListView' }"
				class="text-brand"
			>
				{{ __("History") }}
			</router-link>
		</div>

		<template v-if="settings.data?.allow_employee_checkin_from_mobile_app">
			<div v-if="checkins.list.loading && !checkins.data" class="mt-3.5 flex flex-col gap-2">
				<div class="h-[26px] w-52 rounded-md bg-gray-100 animate-pulse"></div>
				<div class="h-[15px] w-36 rounded-md bg-gray-100 animate-pulse"></div>
			</div>
			<template v-else>
				<div
					class="mt-3.5 font-bold text-ink tracking-tight leading-tight"
					:class="todayStatus.title.length > 22 ? 'text-[22px]' : 'text-[26px]'"
				>
					{{ todayStatus.title }}
				</div>
				<div v-if="todayStatus.detail" class="mt-1 text-[15px] text-ink-muted">
					{{ todayStatus.detail }}
				</div>
			</template>

			<!-- Check In is the filled button; Check Out uses the quieter tinted style -->
			<button
				id="open-checkin-modal"
				class="mt-[18px] w-full flex flex-row items-center justify-center gap-2 py-3.5 rounded-full text-[17px] font-semibold transition-transform active:scale-[0.97] disabled:opacity-60"
				:class="isCheckedIn ? 'bg-brand-tint text-brand' : 'bg-brand text-white'"
				:disabled="checkins.list.loading"
				@click="handleEmployeeCheckin"
			>
				<FeatherIcon :name="isCheckedIn ? 'log-out' : 'log-in'" class="h-[18px] w-[18px]" />
				{{ nextAction.label }}
			</button>
		</template>

		<template v-else>
			<div class="mt-3.5 text-[26px] font-bold text-ink tracking-tight leading-tight">
				{{ employee?.data?.employee_name }}
			</div>
			<div v-if="employeeDetail" class="mt-1 text-[15px] text-ink-muted">
				{{ employeeDetail }}
			</div>
		</template>
	</div>

	<ion-modal
		v-if="settings.data?.allow_employee_checkin_from_mobile_app"
		ref="modal"
		trigger="open-checkin-modal"
		:initial-breakpoint="1"
		:breakpoints="[0, 1]"
	>
		<div class="w-full max-h-[85vh] overflow-y-auto flex flex-col items-center gap-5 p-4 pb-8 bg-page">
			<!-- a check-in left open past 3am: fill in when they left before checking in again -->
			<div v-if="missedCheckout" class="w-full flex flex-row gap-3 mt-2 rounded-card bg-[#FEF3C7] p-4">
				<FeatherIcon name="alert-triangle" class="h-5 w-5 shrink-0 text-[#B45309]" />
				<div class="flex flex-col gap-1">
					<span class="text-[15px] font-semibold text-ink">{{ __("You forgot to check out") }}</span>
					<span class="text-[13px] text-ink-muted">
						{{
							__("{0}, checked in at {1}. Fill in when you left; it goes to HR as an attendance request.", [
								dayjs(missedCheckout.date).format("dddd, D MMM"),
								dayjs(missedCheckout.check_in_time).format("h:mm a"),
							])
						}}
					</span>
				</div>
			</div>

			<div v-else class="flex flex-col gap-1.5 mt-2 items-center justify-center">
				<div class="font-bold text-xl">
					{{ dayjs(checkinTimestamp).format("hh:mm:ss a") }}
				</div>
				<div class="font-medium text-gray-500 text-sm">
					{{ dayjs().format("D MMM, YYYY") }}
				</div>
			</div>

			<template v-if="settings.data?.allow_geolocation_tracking && !missedCheckout">
				<span v-if="locationStatus" class="font-medium text-ink-subtle text-sm text-center">
					{{ locationStatus }}
				</span>

				<div class="rounded border-4 translate-z-0 block overflow-hidden w-full h-170">
					<iframe
						width="100%"
						height="170"
						frameborder="0"
						scrolling="no"
						marginheight="0"
						marginwidth="0"
						style="border: 0"
						:src="`https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=15&amp;output=embed`"
					>
					</iframe>
				</div>
			</template>

			<!-- Timesheet: charge code at check-in, extra charge codes at check-out -->
			<div v-if="timesheetEnabled" class="app-field w-full flex flex-col gap-3 bg-white rounded-card p-4">
				<div class="flex flex-row items-center gap-2">
					<FeatherIcon name="clipboard" class="h-4 w-4 text-brand" />
					<span class="text-[15px] font-semibold text-ink">{{ __("Timesheet") }}</span>
					<span v-if="timesheetContext.data" class="ml-auto text-[12px] text-ink-subtle">
						{{ dayjs(timesheetContext.data.period_start).format("D MMM") }} –
						{{ dayjs(timesheetContext.data.period_end).format("D MMM") }}
					</span>
				</div>

				<template v-if="missedCheckout">
					<span class="block px-1 text-[13px] font-medium text-ink-subtle after:content-['_*'] after:text-red-600">
						{{ __("Check-out time") }}
					</span>
					<!-- a list rather than <input type="time">, which Safari doesn't report until blurred -->
					<select v-model="missedOutTime" class="form-select w-full">
						<option value="" disabled>{{ __("Select time") }}</option>
						<option v-for="option in missedTimeOptions" :key="option.value" :value="option.value">
							{{ option.label }}
						</option>
					</select>
				</template>

				<template v-if="nextAction.action === 'IN' && !missedCheckout">
					<span class="block px-1 text-[13px] font-medium text-ink-subtle after:content-['_*'] after:text-red-600">
						{{ __("Charge Code") }}
					</span>
					<SearchSelect
						:options="chargeCodeOptions"
						:modelValue="selectedChargeCodes[0] || null"
						:placeholder="__('Select Charge Code')"
						@update:modelValue="(value) => (selectedChargeCodes = value ? [value] : [])"
					/>
				</template>

				<template v-else>
					<span class="block px-1 text-[13px] font-medium text-ink-subtle">
						{{
							missedCheckout
								? __("Charge codes worked on {0}", [dayjs(missedCheckout.date).format("D MMM")])
								: __("Charge codes worked on today")
						}}
					</span>
					<div
						v-for="(code, index) in selectedChargeCodes"
						:key="code"
						class="flex flex-row items-center gap-3 rounded-xl bg-[#F1F3F6] px-3 py-2.5"
					>
						<div class="flex flex-col grow min-w-0">
							<span class="text-[15px] font-semibold text-ink">{{ code }}</span>
							<span class="text-[12px] text-ink-subtle truncate">{{ chargeCodeLabel(code) }}</span>
						</div>
						<span v-if="hoursEach" class="text-[13px] font-semibold text-brand whitespace-nowrap">
							{{ hoursEach }} {{ __("hrs") }}
						</span>
						<button
							v-if="selectedChargeCodes.length > 1"
							class="flex items-center justify-center h-7 w-7 rounded-full text-ink-subtle active:bg-gray-200"
							:aria-label="__('Remove')"
							@click="selectedChargeCodes.splice(index, 1)"
						>
							<FeatherIcon name="x" class="h-4 w-4" />
						</button>
					</div>
					<SearchSelect
						:options="chargeCodeOptions.filter((option) => !selectedChargeCodes.includes(option.value))"
						:modelValue="null"
						:placeholder="
							selectedChargeCodes.length ? __('+ Add another charge code') : __('Select Charge Code')
						"
						@update:modelValue="(value) => value && selectedChargeCodes.push(value)"
					/>
					<span v-if="!selectedChargeCodes.length" class="px-1 text-[13px] text-[#B45309]">
						{{ __("Pick at least one charge code to check out") }}
					</span>
					<span v-else-if="workedHours" class="px-1 text-[13px] text-ink-subtle">
						{{
							__(
								missedCheckout
									? "{0} hrs that day, split equally between {1} charge code(s)"
									: "{0} hrs today, split equally between {1} charge code(s)",
								[workedHours.toFixed(1), selectedChargeCodes.length]
							)
						}}
					</span>
				</template>

				<span class="block px-1 text-[13px] font-medium text-ink-subtle">{{ __("Activity Type") }}</span>
				<SearchSelect
					:options="activityTypeOptions"
					:modelValue="selectedActivityType"
					:placeholder="__('Select Activity Type')"
					@update:modelValue="(value) => (selectedActivityType = value || null)"
				/>

				<template v-if="missedCheckout">
					<span class="block px-1 text-[13px] font-medium text-ink-subtle after:content-['_*'] after:text-red-600">
						{{ __("Reason") }}
					</span>
					<textarea
						v-model="missedReason"
						rows="3"
						class="form-textarea w-full"
						:placeholder="__('e.g. Phone battery died before I could check out')"
					></textarea>
				</template>
			</div>

			<Button
				v-if="missedCheckout"
				:loading="missedCheckoutSubmit.loading"
				:disabled="!selectedChargeCodes.length || !missedOutAt || !missedReason.trim()"
				variant="solid"
				class="w-full py-6 !rounded-full !bg-brand hover:!bg-brand-strong text-[17px] font-semibold"
				@click="submitMissedCheckout"
			>
				{{ __("Submit & Continue") }}
			</Button>

			<Button
				v-else
				:loading="checkins.insert.loading || timesheetCheckin.loading"
				:disabled="timesheetEnabled && !selectedChargeCodes.length"
				variant="solid"
				class="w-full py-6 !rounded-full !bg-brand hover:!bg-brand-strong text-[17px] font-semibold"
				@click="submitLog(nextAction.action)"
			>
				{{ __("Confirm {0}", [nextAction.label]) }}
			</Button>
		</div>
	</ion-modal>
</template>

<script setup>
import { createListResource, createResource, toast, FeatherIcon } from "frappe-ui"
import SearchSelect from "@/components/SearchSelect.vue"
import { computed, inject, ref, onMounted, onBeforeUnmount } from "vue"
import { IonModal, modalController } from "@ionic/vue"

import { formatTimestamp } from "@/utils/formatters"
import { settings } from "@/data/settings"

const DOCTYPE = "Employee Checkin"

const socket = inject("$socket")
const employee = inject("$employee")
const dayjs = inject("$dayjs")
const __ = inject("$translate")
const checkinTimestamp = ref(null)
const latitude = ref(0)
const longitude = ref(0)
const locationStatus = ref("")

const checkins = createListResource({
	doctype: DOCTYPE,
	fields: ["name", "employee", "employee_name", "log_type", "time", "device_id"],
	filters: {
		employee: employee.data.name,
	},
	orderBy: "time desc",
})
checkins.reload()

const lastLog = computed(() => {
	if (checkins.list.loading || !checkins.data) return {}
	return checkins.data[0]
})

const lastLogType = computed(() => {
	return lastLog?.value?.log_type === "IN" ? "check-in" : "check-out"
})

// a working day runs until 3am; a check-in still open after that was never checked out
const CUTOFF_HOURS = 3
const workDate = (time) => dayjs(time).subtract(CUTOFF_HOURS, "hour").format("YYYY-MM-DD")
const isStaleCheckin = computed(
	() => lastLog.value?.log_type === "IN" && workDate(lastLog.value.time) < workDate(dayjs())
)

const isCheckedIn = computed(() => lastLog?.value?.log_type === "IN" && !isStaleCheckin.value)

const employeeDetail = computed(() =>
	[employee?.data?.designation, employee?.data?.department].filter(Boolean).join(" · ")
)

function formatDuration(minutes) {
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const todayStatus = computed(() => {
	const log = lastLog.value
	if (!log?.time) return { title: __("Not checked in yet"), detail: employeeDetail.value }

	const time = dayjs(log.time)
	const isToday = time.isSame(dayjs(), "day")
	if (isStaleCheckin.value)
		return {
			title: __("Not checked in yet"),
			detail: __("You didn't check out on {0}", [dayjs(workDate(log.time)).format("D MMM")]),
		}
	if (log.log_type === "IN" && isToday)
		return {
			title: __("Checked in at {0}", [time.format("h:mm a")]),
			detail: __("On the clock for {0}", [formatDuration(dayjs().diff(time, "minute"))]),
		}
	if (log.log_type === "IN")
		return {
			title: __("Checked in since {0}", [time.format("D MMM, h:mm a")]),
			detail: __("You haven't checked out yet"),
		}
	if (isToday) return { title: __("Checked out at {0}", [time.format("h:mm a")]), detail: "" }
	return { title: __("Not checked in yet"), detail: employeeDetail.value }
})

const nextAction = computed(() => {
	return isCheckedIn.value
		? { action: "OUT", label: __("Check Out") }
		: { action: "IN", label: __("Check In") }
})

function handleLocationSuccess(position) {
	latitude.value = position.coords.latitude
	longitude.value = position.coords.longitude

	locationStatus.value = [
		__("Latitude: {0}°", [Number(latitude.value).toFixed(5)]),
		__("Longitude: {0}°", [Number(longitude.value).toFixed(5)]),
	].join(", ")
}

function handleLocationError(error) {
	// browsers only expose geolocation on HTTPS (or localhost) pages
	if (!window.isSecureContext) {
		locationStatus.value = __("Location needs a secure (HTTPS) connection. Please open the app using its https:// address.")
	} else if (error?.code === 1) {
		locationStatus.value = __("Location access is blocked. Allow location for this site in your browser settings, then try again.")
	} else {
		locationStatus.value = __("Unable to retrieve your location")
		if (error) locationStatus.value += `: ERROR(${error.code}): ${error.message}`
	}
}

const fetchLocation = () => {
	if (!navigator.geolocation) {
		locationStatus.value = __("Geolocation is not supported by your current browser")
	} else {
		locationStatus.value = __("Locating...")
		navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError)
	}
}

// Timesheet integration (hse_management.timesheet_checkin); hidden if that app is missing
const timesheetContext = createResource({
	url: "hse_management.timesheet_checkin.get_checkin_context",
	onSuccess(data) {
		// check-in: last used code; check-out: codes already logged today, else the check-in code
		const codes = data.today_charge_codes?.length
			? [...data.today_charge_codes]
			: [data.charge_code].filter(Boolean)
		selectedChargeCodes.value = nextAction.value.action === "IN" && !data.missed_checkout ? codes.slice(0, 1) : codes
		selectedActivityType.value = data.activity_type || null
	},
})
const missedCheckout = computed(() => timesheetContext.data?.missed_checkout || null)
const missedOutTime = ref("")
const missedReason = ref("")
// every 5 minutes from the last check-in until 3am the next morning
const missedTimeOptions = computed(() => {
	if (!missedCheckout.value) return []
	const day = dayjs(missedCheckout.value.date)
	const end = day.add(1, "day").hour(CUTOFF_HOURS).minute(0)
	const checkedIn = dayjs(missedCheckout.value.last_check_in_time)
	let time = checkedIn.startOf("minute").add(5 - (checkedIn.minute() % 5), "minute")
	const options = []
	for (; time.isBefore(end); time = time.add(5, "minute"))
		options.push({
			value: time.format("YYYY-MM-DD HH:mm:ss"),
			label: time.isSame(day, "day") ? time.format("h:mm a") : __("{0} (next day)", [time.format("h:mm a")]),
		})
	return options
})
const missedOutAt = computed(() => (missedCheckout.value && missedOutTime.value ? dayjs(missedOutTime.value) : null))
const timesheetEnabled = computed(() => Boolean(timesheetContext.data))
const selectedChargeCodes = ref([])
const selectedActivityType = ref(null)

const chargeCodes = createListResource({
	doctype: "Charge Code",
	fields: ["name", "description", "work_group"],
	orderBy: "name asc",
	pageLength: 1000,
})
const activityTypes = createListResource({
	doctype: "Activity Type",
	fields: ["name"],
	orderBy: "name asc",
	pageLength: 200,
})

const chargeCodeOptions = computed(() =>
	(chargeCodes.data || []).map((code) => ({
		label: [code.name, code.description || code.work_group].filter(Boolean).join(" · "),
		value: code.name,
	}))
)
const activityTypeOptions = computed(() =>
	(activityTypes.data || []).map((type) => ({ label: type.name, value: type.name }))
)

function chargeCodeLabel(code) {
	const doc = (chargeCodes.data || []).find((c) => c.name === code)
	return doc?.description || doc?.work_group || ""
}

// first check-in of the working day until now (or until the filled-in missed check-out)
const workedHours = computed(() => {
	if (missedCheckout.value)
		return missedOutAt.value
			? missedOutAt.value.diff(dayjs(missedCheckout.value.check_in_time), "minute") / 60
			: 0
	const firstIn = (checkins.data || [])
		.filter((log) => log.log_type === "IN" && workDate(log.time) === workDate(dayjs()))
		.at(-1)
	return firstIn ? dayjs(checkinTimestamp.value).diff(dayjs(firstIn.time), "minute") / 60 : 0
})
const hoursEach = computed(() =>
	workedHours.value && selectedChargeCodes.value.length
		? (workedHours.value / selectedChargeCodes.value.length).toFixed(1)
		: ""
)

timesheetContext.reload()
chargeCodes.reload()
activityTypes.reload()

const timesheetCheckin = createResource({
	url: "hse_management.timesheet_checkin.log_checkin",
	method: "POST",
})

const missedCheckoutSubmit = createResource({
	url: "hse_management.timesheet_checkin.submit_missed_checkout",
	method: "POST",
})

const submitMissedCheckout = () => {
	missedCheckoutSubmit.submit(
		{
			checkout_time: missedOutAt.value.format("YYYY-MM-DD HH:mm:ss"),
			reason: missedReason.value.trim(),
			charge_codes: selectedChargeCodes.value,
			activity_type: selectedActivityType.value,
		},
		{
			onSuccess(data) {
				missedOutTime.value = ""
				missedReason.value = ""
				if (data.attendance_request)
					showToast(__("Sent to HR"), __("Attendance request {0} was created", [data.attendance_request]))
				else if (data.attendance_note) showToast(__("Saved"), data.attendance_note)
				if (data.timesheet_error) showToast(__("Timesheet not updated"), data.timesheet_error, false)
				// the popup carries on with today's check-in
				checkinTimestamp.value = dayjs().format("YYYY-MM-DD HH:mm:ss")
				timesheetContext.reload()
				if (settings.data?.allow_geolocation_tracking) fetchLocation()
			},
			onError(error) {
				for (const message of error.messages || [__("Could not save the missed check-out")])
					showToast(__("Error"), message, false)
			},
		}
	)
}

const showToast = (title, text, success = true) =>
	toast({
		title,
		text,
		icon: success ? "check-circle" : "alert-circle",
		position: "bottom-center",
		iconClasses: success ? "text-green-500" : "text-red-500",
	})

const handleEmployeeCheckin = () => {
	checkinTimestamp.value = dayjs().format("YYYY-MM-DD HH:mm:ss")
	if (timesheetEnabled.value) timesheetContext.reload()

	if (settings.data?.allow_geolocation_tracking) {
		fetchLocation()
	}
}

const submitLog = (logType) => {
	const actionLabel = logType === "IN" ? __("Check-in") : __("Check-out")

	if (timesheetEnabled.value) {
		timesheetCheckin.submit(
			{
				log_type: logType,
				time: checkinTimestamp.value,
				charge_codes: selectedChargeCodes.value,
				activity_type: selectedActivityType.value,
				latitude: latitude.value,
				longitude: longitude.value,
			},
			{
				onSuccess(data) {
					modalController.dismiss()
					checkins.reload()
					showToast(__("Success"), __("{0} successful!", [actionLabel]))
					if (data.timesheet_error)
						showToast(__("Timesheet not updated"), data.timesheet_error, false)
					else if (data.timesheet)
						showToast(__("Timesheet updated"), __("Today's hours were added to {0}", [data.timesheet]))
				},
				onError(error) {
					for (const message of error.messages || [__("{0} failed!", [actionLabel])])
						showToast(__("Error"), message, false)
				},
			}
		)
		return
	}

	checkins.insert.submit(
		{
			employee: employee.data.name,
			log_type: logType,
			time: checkinTimestamp.value,
			latitude: latitude.value,
			longitude: longitude.value,
		},
		{
			onSuccess() {
				modalController.dismiss()
				toast({
					title: __("Success"),
					text: __("{0} successful!", [actionLabel]),
					icon: "check-circle",
					position: "bottom-center",
					iconClasses: "text-green-500",
				})
			},
			onError(error) {
				let messages = error.messages || []

				for (const message of messages) {
					toast({
						title: __("Error"),
						text: message || __("{0} failed!", [actionLabel]),
						icon: "alert-circle",
						position: "bottom-center",
						iconClasses: "text-red-500",
					})
				}
			},
		}
	)
}

onMounted(() => {
	socket.emit("doctype_subscribe", DOCTYPE)
	socket.on("list_update", (data) => {
		if (data.doctype == DOCTYPE) {
			checkins.reload()
		}
	})
})

onBeforeUnmount(() => {
	socket.emit("doctype_unsubscribe", DOCTYPE)
	socket.off("list_update")
})
</script>
