import { Tabs, Tab, type TabsProps } from "@mui/material";
import { useState, type SyntheticEvent, type ReactNode, Children, useMemo } from "react";
import type { GCompProps } from "../../components/common/GProps.tsx";
import { ttr } from "../../localization/localization.ts";
import { CTabStyle, type ITabStyle } from "../../styles/components/navigation/CTabsStyle.ts";
import type { TSize } from "../../types/string.ts";

export interface CTabsProps extends GCompProps, TabsProps {
	tabs: string[] | ReactNode[];
	defaultTab?: number;
	children: ReactNode;

	size?: TSize;
}

//TODO: Replace sx
function CTabs({ tabs, defaultTab, testid, size = "sm", children, sx, ...others }: CTabsProps) {
	//====================== STATS ======================
	const [tab, setTab] = useState<number>(defaultTab == undefined ? 0 : defaultTab);

	//====================== DATA ======================
	const childList = Children.toArray(children);
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
	}, [tabs, testid, style]);

	//====================== DOM ======================
	return (
		<>
			<Tabs
				value={tab}
				onChange={(_: SyntheticEvent, newValue: number) => setTab(newValue)}
				centered
				sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
				data-testid={testid ? testid : null}
				{...others}
			>
				{tabsNode}
			</Tabs>
			{childList[tab]}
		</>
	);
}

export default CTabs;
