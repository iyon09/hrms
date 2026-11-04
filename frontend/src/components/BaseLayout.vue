<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full bg-page/90 backdrop-blur-md px-5 pt-4 pb-3 standalone:pt-safe-top">
				<div class="flex flex-row items-center justify-end gap-2.5 min-h-[36px]">
					<router-link
						:to="{ name: 'Notifications' }"
						v-slot="{ navigate }"
						class="flex flex-col items-center"
					>
						<button
							class="relative flex items-center justify-center h-9 w-9 rounded-full bg-white text-brand"
							:aria-label="__('Notifications')"
							@click="navigate"
						>
							<FeatherIcon name="bell" class="h-[18px] w-[18px]" />
							<span
								v-if="unreadNotificationsCount.data"
								class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-red-500 rounded-full border-2 border-page"
							>
								{{ unreadNotificationsCount.data > 9 ? "9+" : unreadNotificationsCount.data }}
							</span>
						</button>
					</router-link>
					<router-link :to="{ name: 'Profile' }" class="flex flex-col items-center">
						<Avatar
							:image="user.data.user_image"
							:label="user.data.first_name"
							size="xl"
						/>
					</router-link>
				</div>
				<h1 class="font-heading text-[30px] leading-tight font-bold text-ink tracking-tight mt-1">
					{{ props.pageTitle || __("Frappe HR") }}
				</h1>
				<p v-if="props.subtitle" class="text-[15px] text-ink-subtle truncate mt-0.5">
					{{ props.subtitle }}
				</p>
			</div>
		</ion-header>

		<ion-content class="ion-no-padding">
			<div class="flex flex-col w-full">
				<slot name="body"></slot>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonHeader, IonContent, IonPage } from "@ionic/vue"
import { FeatherIcon, Avatar } from "frappe-ui"

import { unreadNotificationsCount } from "@/data/notifications"

import { inject } from "vue"

const user = inject("$user")
const __ = inject("$translate")

const props = defineProps({
	pageTitle: {
		type: String,
		required: false,
		default: "",
	},
	subtitle: {
		type: String,
		required: false,
		default: "",
	},
})
</script>
