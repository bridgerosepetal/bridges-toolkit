const TEXT_AUDIT_FRAME_GROUP_ID_PLUGIN_DATA_KEY =
	"bridgesToolkit.textAudit.frameGroupId";

const LEGACY_SCREEN_MARK_PLUGIN_DATA_KEY = "textAuditScreen";
const LEGACY_SECTION_ROLE_ID_PLUGIN_DATA_KEY = "textAuditSectionRoleId";

type PluginDataNode = BaseNodeMixin;

export function getTextAuditFrameGroupId(node: PluginDataNode): string {
	const value = node.getPluginData(TEXT_AUDIT_FRAME_GROUP_ID_PLUGIN_DATA_KEY);
	if (value.length > 0) {
		return value;
	}

	const legacySectionRoleId = node.getPluginData(
		LEGACY_SECTION_ROLE_ID_PLUGIN_DATA_KEY,
	);
	if (legacySectionRoleId.length > 0) {
		return legacySectionRoleId;
	}

	return node.getPluginData(LEGACY_SCREEN_MARK_PLUGIN_DATA_KEY) === "1"
		? node.id
		: "";
}

export function isTextAuditFrameGroupMarked(node: PluginDataNode): boolean {
	return getTextAuditFrameGroupId(node).length > 0;
}

export function setTextAuditFrameGroupId(
	node: PluginDataNode,
	frameGroupId: string,
): void {
	node.setPluginData(
		TEXT_AUDIT_FRAME_GROUP_ID_PLUGIN_DATA_KEY,
		frameGroupId,
	);
	node.setPluginData(LEGACY_SCREEN_MARK_PLUGIN_DATA_KEY, "");
	node.setPluginData(LEGACY_SECTION_ROLE_ID_PLUGIN_DATA_KEY, "");
}
