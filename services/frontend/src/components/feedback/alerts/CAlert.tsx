import { Alert, type AlertProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import type { IAppNotif } from "../../../types/events";
import CText from "../../text/CText";
import { appAnimation, appTexts } from "../../../styles/theme";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sxMerger } from "../../../utils/styles";
import { CAlertStyle, type ICAlertStyle } from "../../../styles/components/feedback/CAlertStyle";

interface CAlertProps extends GCompProps, AlertProps {
	notif: IAppNotif;
	time: number;
	fadeSpeed?: number;
}

function CAlert({
	notif,
	time,
	fadeSpeed = appAnimation.timing.medium_slow,
	sx,
	...other
}: CAlertProps) {
	const [visible, setVisible] = useState<boolean>(true);
	const [opacity, setOpacity] = useState<number>(1);
	const [to, setTO] = useState<number>(-1);

	const closeAlert = useCallback(() => {
		setOpacity(0);
		setTimeout(() => {
			setVisible(false);
		}, fadeSpeed);
	}, [fadeSpeed]);

	useEffect(() => {
		async function start() {
			if (to >= 0) return;
			setTO(
				setTimeout(() => {
					closeAlert();
				}, time),
			);
		}
		start();
	}, [to, time, closeAlert]);

	const style: ICAlertStyle = useMemo(() => {
		return CAlertStyle(fadeSpeed);
	}, [fadeSpeed]);

	return (
		<Alert
			sx={sxMerger(style.main, sx ? sx : {}, {
				opacity,
				display: !visible ? "none" : undefined,
			})}
			variant="filled"
			severity={notif.severity}
			onClose={closeAlert}
			{...other}
		>
			<CText sx={{ m: 0 }} family={appTexts.text.secondaryFamily} fontWeight={600} size="md">
				{notif.message}
			</CText>
		</Alert>
	);
}

export default CAlert;
