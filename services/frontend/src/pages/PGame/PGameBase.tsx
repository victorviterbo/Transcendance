import { useParams } from "react-router-dom";
import PGame from ".";
import GPageBase from "../common/GPageBases";

function PGameBase() {
	const { gameid } = useParams();

	return (
		<GPageBase inGame={true} key={gameid}>
			<PGame />
		</GPageBase>
	);
}

export default PGameBase;
