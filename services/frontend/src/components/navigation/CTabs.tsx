import { Tabs, Tab } from "@mui/material";
import { useState, type SyntheticEvent, type ReactNode, Children } from "react";
import type { GCompProps } from "../../components/common/GProps.tsx";
import { ttr } from "../../localization/localization.ts";

interface CTabsProps extends GCompProps {
	tabs: string[];
	children: ReactNode;
}

//TODO: Replace sx
function CTabs({ tabs, children }: CTabsProps) {
	//====================== STATS ======================
	const [tab, setTab] = useState<number>(0);

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
			>
				{tabs.map((item, index) => (
					<Tab key={index} label={ttr(item)} />
				))}
			</Tabs>
			{childList[tab]}
		</>
	);
}

export default CTabs;
