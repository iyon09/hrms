<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<div class="flex flex-col h-full w-full">
				<div class="app-form w-full h-full bg-page flex flex-col">
					<PageHeader :title="__('Change Password')" />

					<div class="bg-page grow overflow-y-auto">
						<form class="app-field flex flex-col space-y-4 m-4 p-4 bg-white rounded-card" @submit.prevent="submitPasswordChange">
							<Input
								:label="__('Current Password') + ' *'"
								type="password"
								v-model="currentPassword"
								autocomplete="current-password"
								required
							/>
							<Input
								:label="__('New Password') + ' *'"
								type="password"
								v-model="newPassword"
								autocomplete="new-password"
								required
							/>
							<Input
								:label="__('Confirm New Password') + ' *'"
								type="password"
								v-model="confirmPassword"
								autocomplete="new-password"
								required
							/>
						</form>
					</div>

					<div
						class="px-4 pt-3 pb-4 standalone:pb-safe-bottom bg-page/90 backdrop-blur-md sticky bottom-0 w-full z-40"
					>
						<ErrorMessage class="mb-2" :message="changePasswordError" />
						<Button
							class="w-full !rounded-full py-6 text-[17px] font-semibold !bg-brand hover:!bg-brand-strong !text-white disabled:opacity-60"
							:loading="updatePasswordResource.loading"
							variant="solid"
							@click="submitPasswordChange"
						>
							{{ __("Update Password") }}
						</Button>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import PageHeader from "@/components/PageHeader.vue"
import { IonPage, IonContent } from "@ionic/vue"
import { useRouter } from "vue-router"
import { FeatherIcon, toast, createResource, Input, ErrorMessage, Button } from "frappe-ui"

import { inject, ref } from "vue"

const __ = inject("$translate")
const router = useRouter()

const changePasswordError = ref("")
const currentPassword = ref("")
const newPassword = ref("")
const confirmPassword = ref("")

const updatePasswordResource = createResource({
	url: "frappe.core.doctype.user.user.update_password",
	method: "POST",
	onSuccess() {
		toast({
			title: __("Success"),
			text: __("Your password has been updated."),
			icon: "check-circle",
			position: "bottom-center",
			iconClasses: "text-green-500",
		})
		resetForm()
		router.back()
	},
	onError(error) {
		changePasswordError.value = error.messages?.[0] || __("Failed to update password")
	},
})

function resetForm() {
	changePasswordError.value = ""
	currentPassword.value = ""
	newPassword.value = ""
	confirmPassword.value = ""
}

function submitPasswordChange() {
	if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
		changePasswordError.value = __("Please fill all fields")
		return
	}

	if (newPassword.value !== confirmPassword.value) {
		changePasswordError.value = __("New passwords do not match")
		return
	}

	changePasswordError.value = ""
	updatePasswordResource.submit({
		old_password: currentPassword.value,
		new_password: newPassword.value,
	})
}
</script>
