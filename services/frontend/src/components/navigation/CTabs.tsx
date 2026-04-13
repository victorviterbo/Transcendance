import { Tabs, Tab, type TabsProps } from "@mui/material";
import { useState, type SyntheticEvent, type ReactNode, Children } from "react";
import type { GCompProps } from "../../components/common/GProps.tsx";
import { ttr } from "../../localization/localization.ts";
import { CTabStyle } from "../../styles/components/navigation/CTabsStyle.ts";

export interface CTabsProps extends GCompProps, TabsProps {
	tabs: string[];
	defaultTab?: number;
	children: ReactNode;
}

//TODO: Replace sx
function CTabs({ tabs, defaultTab, testid, children }: CTabsProps) {
	//====================== STATS ======================
	const [tab, setTab] = useState<number>(defaultTab == undefined ? 0 : defaultTab);

	//====================== DATA ======================
	const childList = Children.toArray(children);

	//====================== DOM ======================
	return (
		<>
			<Tabs
				value={tab}
				onChange={(_: SyntheticEvent, newValue: number) => setTab(newValue)}
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
			{childList[tab]}
		</>
	);
}

export default CTabs;
