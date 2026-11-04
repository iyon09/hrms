import { computed } from "vue"
import { createResource } from "frappe-ui"

// one entry per request type, each with the items waiting on the signed-in user
export const approvals = createResource({
	url: "hse_management.approvals.get_approvals",
	cache: "hrms:approvals:v2",
	auto: true,
})

export const pendingApprovalsCount = computed(() =>
	(approvals.data || []).reduce((sum, tab) => sum + tab.count, 0)
)
