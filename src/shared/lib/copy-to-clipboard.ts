export async function copyTextToClipboard(text: string): Promise<void> {
	if (
		navigator.clipboard &&
		typeof navigator.clipboard.writeText === "function"
	) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.setAttribute("readonly", "");
	textArea.style.position = "absolute";
	textArea.style.left = "-9999px";
	document.body.appendChild(textArea);
	textArea.select();

	const success = document.execCommand("copy");
	document.body.removeChild(textArea);

	if (!success) {
		throw new Error("Clipboard copy failed.");
	}
}
