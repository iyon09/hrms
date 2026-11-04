<template>
	<ion-page>
		<ion-tabs>
			<ion-router-outlet></ion-router-outlet>
			<BottomTabs />
		</ion-tabs>

		<button
			class="quick-access-button absolute right-4 z-10 flex items-center justify-center h-[62px] w-[62px] rounded-full text-brand transition-transform active:scale-90"
			:aria-label="__('Quick Access')"
			@click="showQuickAccess = true"
		>
			<FeatherIcon name="grid" class="h-6 w-6" />
		</button>

		<QuickAccessSheet :isOpen="showQuickAccess" @close="showQuickAccess = false" />
	</ion-page>
</template>

<script setup>
import { ref, inject } from "vue"
import { IonTabs, IonPage, IonRouterOutlet } from "@ionic/vue"
import { FeatherIcon } from "frappe-ui"

import BottomTabs from "@/components/BottomTabs.vue"
import QuickAccessSheet from "@/components/QuickAccessSheet.vue"

const __ = inject("$translate")
const showQuickAccess = ref(false)
</script>

<style scoped>
.quick-access-button {
	bottom: 12px;
	background: rgba(255, 255, 255, 0.8);
	border: 0.5px solid rgba(255, 255, 255, 0.7);
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
	backdrop-filter: blur(24px);
	-webkit-backdrop-filter: blur(24px);
}

@media (display-mode: standalone) {
	.quick-access-button {
		bottom: max(12px, calc(env(safe-area-inset-bottom) - 4px));
	}
}
</style>
