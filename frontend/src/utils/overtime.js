import dayjs from "@/utils/dayjs"

export const OVERTIME_COLOR = "#0E7C5A"

export const slipStatus = (docstatus) => ["Draft", "Submitted", "Cancelled"][docstatus] || "Draft"

export const statusTheme = { Draft: "orange", Submitted: "green", Cancelled: "red" }

// one full calendar month collapses to its name, anything else shows the range
export function periodLabel(slip) {
	const start = dayjs(slip.start_date)
	const end = dayjs(slip.end_date)
	if (!slip.start_date || !slip.end_date) return "—"
	if (start.date() === 1 && end.isSame(start.endOf("month"), "day")) return start.format("MMMM YYYY")
	return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`
}

export const formatHours = (value) => `${+(value || 0).toFixed(2)}h`
