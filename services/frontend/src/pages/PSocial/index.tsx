import CTabs from "../../components/navigation/CTabs";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import PFriendAdd from "./PFriendAdd";
import PFriendList from "./PFriendList";
function PSocial() {
	return (
		<CTitlePaper
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			sx={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				marginBottom: "20px",
				overflow: "hidden",
			}}
			title={"FRIEND_TITLE"}
			data-testid="PSocial"
		>
			<CTabs tabs={["FRIEND_LISTS", "FRIENDS_ADD", "FRIEND_REQUESTS"]} testid="PSocialTab">
				<PFriendList></PFriendList>
				<PFriendAdd></PFriendAdd>
			</CTabs>
		</CTitlePaper>
	);
}

export default PSocial;
