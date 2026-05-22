import { Stack } from "@mui/material";
import type { GPageProps } from "../../common/GPageBases";
import type { IGamePlayerAnswer } from "../../../types/game";
import CText from "../../../components/text/CText";

interface PGameRoundAnswerProps extends GPageProps {
	answer: IGamePlayerAnswer;
}

function PGameRoundAnswer({ answer }: PGameRoundAnswerProps) {
	return (
		<Stack direction={"row"}>
			<CText>{answer.message}</CText>
			<CText>{answer.time}</CText>
		</Stack>
	);
}

export default PGameRoundAnswer;
