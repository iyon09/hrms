const routes = [
	{
		path: "/overtime-slips",
		name: "OvertimeSlipListView",
		component: () => import("@/views/overtime_slip/List.vue"),
	},
	{
		path: "/overtime-slips/:id",
		name: "OvertimeSlipDetailView",
		props: true,
		component: () => import("@/views/overtime_slip/Detail.vue"),
	},
]

export default routes
