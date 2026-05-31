/** Chia nội dung điều khoản (một đoạn hoặc nhiều dòng) thành các mục hiển thị. */
export function splitPolicyLines(text: string | undefined): string[] {
	if (!text?.trim()) return [];
	return text
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);
}
