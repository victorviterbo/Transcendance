import { Tabs, Tab } from "@mui/material";
import { type SyntheticEvent, Children } from "react";
import { ttr } from "../../localization/localization.ts";
import { CTabStyle } from "../../styles/components/navigation/CTabsStyle.ts";
import type { CTabsProps } from "./CTabs.tsx";

interface CCtrlTabsProps extends CTabsProps {
	activeTab: number;
	onTabChanged: (Value: number) => void;
}

//TODO: Replace sx
function CCtrlTabs({ tabs, activeTab, onTabChanged, testid, children }: CCtrlTabsProps) {
	//====================== DATA ======================
	const childList = Children.toArray(children);

	//====================== DOM ======================
	return (
		<>
			<Tabs
				value={activeTab}
				onChange={(_: SyntheticEvent, newValue: number) => onTabChanged(newValue)}
				centered
				sx={{ mb: 3 }}
				data-testid={testid ? testid : null}
			>
				{tabs.map((item, index) => (
					<Tab
						sx={CTabStyle}
						key={index}
						label={ttr(item)}
						data-testid={testid ? testid + index : null}
					/>
				))}
			</Tabs>
			{childList[activeTab]}
		</>
	);
}

export default CCtrlTabs;
