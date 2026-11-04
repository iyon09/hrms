import frappeUIPreset from "frappe-ui/src/tailwind/preset"
export default {
	presets: [frappeUIPreset],
	content: [
		"./index.html",
		"./src/**/*.{vue,js,ts,jsx,tsx}",
		"./node_modules/frappe-ui/src/components/**/*.{vue,js,ts,jsx,tsx}",
		"../node_modules/frappe-ui/src/components/**/*.{vue,js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			screens: {
				standalone: {
					raw: "(display-mode: standalone)",
				},
			},
			// Design tokens follow the Zentry HRMS Flutter app (lib/theme/app_theme.dart)
			colors: {
				brand: {
					DEFAULT: "#0E7C5A", // primaryStrong: AA-safe text/icons/buttons
					strong: "#11855F",
					soft: "#7BC9A4", // decorative fills only, ~2:1 on white
					tint: "rgba(14, 124, 90, 0.12)",
				},
				page: "#E7EBF0",
				ink: {
					DEFAULT: "#0F172A",
					muted: "#475569",
					subtle: "#64748B",
					faint: "#617188",
				},
				tile: {
					time: "#0E9F6E",
					money: "#F08A24",
					work: "#5B6CF0",
					info: "#3B82F6",
					neutral: "#64748B",
				},
			},
			fontFamily: {
				sans: ['"Plus Jakarta Sans"', "-apple-system", "BlinkMacSystemFont", "InterVar", "sans-serif"],
				heading: ["Sora", '"Plus Jakarta Sans"', "-apple-system", "sans-serif"],
			},
			borderRadius: {
				card: "26px",
			},
			padding: {
				"safe-top": "env(safe-area-inset-top)",
				"safe-right": "env(safe-area-inset-right)",
				"safe-bottom": "env(safe-area-inset-bottom)",
				"safe-left": "env(safe-area-inset-left)",
			},
		},
	},
	plugins: [],
}
