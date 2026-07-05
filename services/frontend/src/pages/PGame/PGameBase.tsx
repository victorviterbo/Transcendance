import { useParams } from "react-router-dom";
import PGame from ".";

function PGameBase() {
	const { gameid } = useParams();

	return (
		<PGame key={gameid}/>
	);
}

export default PGameBase;
