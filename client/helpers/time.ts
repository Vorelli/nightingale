export function secondsToTime(value: number) {
	const hours = Math.floor(value / 60 / 60);
	const minutes = Math.floor(value / 60);
	const remainingSeconds = Math.floor(value % 60);
	const minutesText = minutes < 10 ? "0" + minutes : minutes;
	const secondsText =
		remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
	const hoursText = hours > 0 ? (hours < 10 ? "0" + hours : hours) + ":" : "";
	const formattedString = hoursText + minutesText + ":" + secondsText;
	return formattedString;
}

export function millisecondsToTime(value: number) {
	return secondsToTime(Math.floor(value / 1000));
}
