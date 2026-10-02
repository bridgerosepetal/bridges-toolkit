export async function copyTextToClipboard(text: string): Promise<void> {
	if (
		navigator.clipboard &&
		typeof navigator.clipboard.writeText === "function"
	) {
		try {
			await navigator.clipboard.writeText(text);
			return;
		} catch {
			// Figma's plugin iframe denies the Clipboard API; fall through.
		}
	}

	copyWithExecCommand(text);
}

function copyWithExecCommand(text: string): void {
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
