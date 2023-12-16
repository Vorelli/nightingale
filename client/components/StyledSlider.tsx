import Slider from "@mui/material/Slider";
import styled from "@mui/material/styles/styled";

const StyledSlider = styled(Slider)({
	color: "#hsl(var(--n) / var(--tw-bg-opacity))",
	height: 2,
	padding: "5px 0",
	"& .MuiSlider-root": {
		height: "10px !important",
	},
	"& .MuiSlider-track": {
		border: "none",
	},
	"& .MuiSlider-thumb": {
		height: 12,
		width: 12,
		backgroundColor: "#fff",
		border: "2px solid tg-primary",
		"&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
			boxShadow: "inherit",
		},
		"&:before": {
			display: "none",
		},
	},
	"& .MuiSlider-valueLabel": {
		lineHeight: 1.2,
		fontSize: 12,
		background: "unset",
		padding: 0,
		width: 32,
		height: 32,
		borderRadius: "50% 50% 50% 0",
		backgroundColor: "hsl(var(--n) / var(--tw-bg-opacity))",
		transformOrigin: "bottom left",
		transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
		"&:before": { display: "none" },
		"&.MuiSlider-valueLabelOpen": {
			transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
		},
		"& > *": {
			transform: "rotate(45deg)",
		},
	},
});

export default StyledSlider;
