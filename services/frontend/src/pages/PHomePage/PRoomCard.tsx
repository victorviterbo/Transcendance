import GroupsIcon from "@mui/icons-material/Groups";
import { Box, Stack } from "@mui/material";
import type { IGameListEntry } from "../../types/game";
import type { CButtonProps } from "../../components/inputs/buttons/CButton";
import CButton from "../../components/inputs/buttons/CButton";
import CText from "../../components/text/CText";
import { ttr } from "../../localization/localization";
import {
	PRoomCardButtonStyle,
	PRoomCardContentStyle,
	PRoomCardEmptyGenreStyle,
	PRoomCardGenreStyle,
	PRoomCardGenreTextStyle,
	PRoomCardGenresStyle,
	PRoomCardNameStyle,
	PRoomCardPlayerCountStyle,
	PRoomCardPlayerIconStyle,
	PRoomCardPlayerTextStyle,
} from "../../styles/pages/home/PRoomCardStyle";
import { useNavigate } from "react-router-dom";

interface PRoomCardProps extends CButtonProps {
	infos: IGameListEntry;
}

function PRoomCard({ infos, ...other }: PRoomCardProps) {
	const genres = infos.genres.length > 0 ? infos.genres.map((genre) => ttr(genre)) : [];
	const playerCount = `${infos.playerCount} / ${infos.playerMax}`;
	const navigate = useNavigate();

	return (
		<CButton
			onClick={() => navigate(`/game/${infos.uid}`)}
			sx={PRoomCardButtonStyle}
			{...other}
			data-testid={"PRoomCard"}
		>
			<Stack sx={PRoomCardContentStyle} spacing={1}>
				<Stack direction="row" spacing={1} alignItems="flex-start">
					<CText noTr={true} size="sm" sx={PRoomCardNameStyle}>
						{infos.name}
					</CText>
					<Stack
						direction="row"
						spacing={0.5}
						alignItems="center"
						sx={PRoomCardPlayerCountStyle}
					>
						<GroupsIcon sx={PRoomCardPlayerIconStyle} />
						<CText noTr={true} size="xs" sx={PRoomCardPlayerTextStyle}>
							{playerCount}
						</CText>
					</Stack>
				</Stack>

				<Stack
					direction="row"
					spacing={0.75}
					useFlexGap={true}
					flexWrap="nowrap"
					sx={PRoomCardGenresStyle}
				>
					{genres.length > 0 ? (
						genres.map((genre) => (
							<Box key={genre} sx={PRoomCardGenreStyle}>
								<CText noTr={true} size="xs" sx={PRoomCardGenreTextStyle}>
									{genre}
								</CText>
							</Box>
						))
					) : (
						<CText noTr={true} size="xs" sx={PRoomCardEmptyGenreStyle}>
							{ttr("ROOM_GENRES_EMPTY")}
						</CText>
					)}
				</Stack>
			</Stack>
		</CButton>
	);
}

export default PRoomCard;
