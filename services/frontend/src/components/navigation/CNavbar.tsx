import { AppBar, Box, IconButton, Stack, Toolbar } from "@mui/material";
import { useLocation, Link, useNavigate } from "react-router-dom";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useState } from "react";
import { useAuth } from "../auth/CAuthProvider";
import { type TNavItem } from "../../types/navbar";
import logo from "../../assets/logo.svg";
import CTitle from "../text/CTitle.tsx";
import CNavbarLink from "./CNavbarLink.tsx";
import CNavbarIcon from "./CNavbarIcon.tsx";
import CDialogLanguage from "../feedback/dialogs/CDialogLanguage.tsx";
import { CNavbarStyle } from "../../styles/components/navigation/CNavbarStyle.ts";
import CMenu from "./CMenu.tsx";

function CNavbar() {
	const { status, logout } = useAuth();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
	const isProfileMenuOpen = Boolean(profileAnchor);

	const handleProfileOpen = (event?: React.MouseEvent<HTMLElement>) => {
		if (!event) return;
		setProfileAnchor(event.currentTarget);
	};

	const handleProfileClose = () => {
		setProfileAnchor(null);
	};

	const handleProfileNavigate = () => {
		handleProfileClose();
		navigate("/users/me");
	};

	const handleLogout = async () => {
		handleProfileClose();
		logout();
	};

	const guestItems: TNavItem[] = [
		{ kind: "link", label: "PLAY_GAME", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "LOGIN", to: "/auth" },
	];

	const authedItems: TNavItem[] = [
		{ kind: "link", label: "PLAY_GAME", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "LEADERBOARD", to: "/leaderboard", icon: <LeaderboardIcon /> },
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
		{
			kind: "action",
			icon: <AccountCircleIcon />,
			aria: "Profile",
			onClick: handleProfileOpen,
		},
	];
	const items = status === "authed" ? authedItems : guestItems;
	const linkItems = items.filter(
		(item): item is Extract<TNavItem, { kind: "link" }> => item.kind === "link",
	);
	const actionItems = items.filter(
		(item): item is Extract<TNavItem, { kind: "action" }> => item.kind === "action",
	);

	return (
		<AppBar position="static" sx={CNavbarStyle}>
			<Toolbar>
				<IconButton
					size="medium"
					color="inherit"
					component={Link}
					to="/"
					aria-label="Home"
					sx={{
						height: 54,
						width: 54,
						padding: "4px",
						border: "3px solid rgba(255, 255, 255, 0.82)",
						backgroundColor: "rgba(255, 255, 255, 0.16)",
						boxShadow: "0 6px 0 rgba(23, 15, 56, 0.2)",
						"&:hover": {
							backgroundColor: "rgba(255, 255, 255, 0.22)",
						},
					}}
				>
					<Box
						component="img"
						src={logo}
						alt="Guess Tunes logo"
						sx={{
							height: 42,
							width: 42,
							display: "block",
						}}
					/>
				</IconButton>
				<CTitle size="sm" sx={{ pl: 5, flexGrow: 1 }}>
					Guess Tunes
				</CTitle>
				<Stack direction="row" spacing={2} alignItems="center">
					{linkItems.map((item, idx) => {
						const isActive =
							item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
						return (
							<CNavbarLink
								key={`${item.label}-${idx}`}
								to={item.to}
								label={item.label}
								icon={item.icon}
								active={isActive}
							/>
						);
					})}
					<CDialogLanguage open={false} />
					{actionItems.map((item, idx) => (
						<CNavbarIcon
							key={`${item.aria}-${idx}`}
							aria={item.aria}
							icon={item.icon}
							onClick={item.onClick}
							disabled={item.disabled}
						/>
					))}
				</Stack>
			</Toolbar>
			<CMenu
				anchorEl={profileAnchor}
				open={isProfileMenuOpen}
				onClose={handleProfileClose}
				options={[
					{ label: "MY_PROFILE", action: handleProfileNavigate },
					{ label: "LOGOUT", action: handleLogout },
				]}
			></CMenu>
		</AppBar>
	);
}

export default CNavbar;
