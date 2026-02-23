import { CatchingPokemon } from "@mui/icons-material";
import { AppBar, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { useLocation, Link } from "react-router-dom";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../auth/CAuthProvider";
import { type TNavItem } from "../../types/navbar";

function CNavbar() {
	const { status } = useAuth();
	const { pathname } = useLocation();
	const guestItems: TNavItem[] = [
		{ kind: "link", label: "Play", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "Log in", to: "/auth" },
	];

	const authedItems: TNavItem[] = [
		{ kind: "link", label: "Play", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "Leaderboard", to: "/leaderboard", icon: <LeaderboardIcon /> },
		{
			kind: "action",
			icon: <NotificationsIcon />,
			aria: "Notifications",
			onClick: () => alert("Coming soon"),
		},
		{
			kind: "action",
			icon: <PeopleIcon />,
			aria: "Friends",
			onClick: () => alert("Coming soon"),
		},
		{ kind: "action", icon: <AccountCircleIcon />, aria: "Profile", onClick: () => {} },
	];
	const items = status === "authed" ? authedItems : guestItems;

	return (
		<AppBar position="static">
			<Toolbar>
				<IconButton size="large" edge="start" color="inherit">
					<CatchingPokemon />
				</IconButton>
				<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
					Guess Tunes
				</Typography>
				<Stack direction="row" spacing={2} alignItems="center">
					{items.map((item, idx) => {
						if (item.kind === "link") {
							const isActive =
								item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
							return (
								// TODO CTypography? Also background color is atrocious
								<Typography
									key={`${item.label}-${idx}`}
									component={Link}
									to={item.to}
									sx={{
										textDecoration: "none",
										color: "inherit",
										display: "inline-flex",
										gap: 1,
										backgroundColor: isActive
											? "rgba(255,255,255,0.15)"
											: "transparent",
									}}
								>
									{item.icon}
									{item.label}
								</Typography>
							);
						}

						return (
							<IconButton
								key={`${item.aria}-${idx}`}
								color="inherit"
								aria-label={item.aria}
								onClick={item.onClick}
								disabled={item.disabled}
							>
								{item.icon}
							</IconButton>
						);
					})}
				</Stack>
			</Toolbar>
		</AppBar>
	);
}

export default CNavbar;
