import { Tabs, Tab } from "@mui/material";
import { type ReactNode, type SyntheticEvent, Children, useMemo } from "react";
import { CTabStyle, type ITabStyle } from "../../styles/components/navigation/CTabsStyle.ts";
import type { CTabsProps } from "./CTabs.tsx";
import { useLang } from "../contexts/CLanguageProvider.tsx";

interface CCtrlTabsProps extends CTabsProps {
	activeTab: number;
	onTabChanged: (Value: number) => void;
}

//TODO: Replace sx
function CCtrlTabs({
	tabs,
	activeTab,
	onTabChanged,
	testid,
	sx,
	size = "sm",
	children,
	orientation,
}: CCtrlTabsProps) {
	//====================== DATA ======================
	const childList = Children.toArray(children);
	const { ttr } = useLang();

	const style: ITabStyle = useMemo(() => {
		return CTabStyle(size);
	}, [size]);

	const tabsNode: ReactNode[] = useMemo(() => {
		return tabs.map((item, index) => (
			<Tab
				sx={style.main}
				key={index}
				label={typeof item == "string" ? ttr(item) : item}
				data-testid={testid ? testid + index : null}
			/>
		));
	}, [tabs, testid, style, ttr]);

	//====================== DOM ======================
	return (
		<>
			<Tabs
				value={activeTab}
				onChange={(_: SyntheticEvent, newValue: number) => onTabChanged(newValue)}
				centered
				sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
				data-testid={testid ? testid : null}
				orientation={orientation}
			>
				{tabsNode}
			</Tabs>
			{childList[activeTab]}
		</>
	);
}

export default CCtrlTabs;
