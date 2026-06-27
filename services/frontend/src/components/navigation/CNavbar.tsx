import { AppBar, Box, IconButton, Stack, Toolbar, useMediaQuery } from "@mui/material";
import { useLocation, Link, useNavigate } from "react-router-dom";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LoginIcon from "@mui/icons-material/Login";
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
import type { GCompProps } from "../common/GProps.ts";
import CNavbarToggle from "./CNavbarToggle.tsx";

interface CNavbarProps extends GCompProps {
	onToggleFriend: () => void;
	isFriendActive: boolean;
	onToggleNotif: () => void;
	isNotifActive: boolean;
	notifCount: number;
}

function CNavbar({
	isFriendActive,
	onToggleFriend,
	onToggleNotif,
	isNotifActive,
	notifCount,
}: CNavbarProps) {
	const { status, logout } = useAuth();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
	const isProfileMenuOpen = Boolean(profileAnchor);
	const hidePlay = useMediaQuery("(max-width:465px)");

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
		{ kind: "link", label: "LOGIN", to: "/auth", icon: <LoginIcon /> },
	];

	const authedItems: TNavItem[] = [
		{ kind: "link", label: "PLAY_GAME", to: "/", icon: <SportsEsportsIcon />, hide: hidePlay },
		{ kind: "link", label: "LEADERBOARD", to: "/leaderboard", icon: <LeaderboardIcon /> },
		{
			kind: "toggle",
			icon: <NotificationsIcon />,
			aria: "Notifications",
			onClick: onToggleNotif,
			active: isNotifActive,
			notifCount: notifCount,
		},
		{
			kind: "toggle",
			icon: <PeopleIcon />,
			aria: "Friends",
			onClick: onToggleFriend,
			active: isFriendActive,
		},
		{
			kind: "action",
			icon: <AccountCircleIcon />,
			aria: "Profile",
			onClick: handleProfileOpen,
		},
	];
	const items = status === "authed" ? authedItems : guestItems;

	return (
		<AppBar position="static" sx={CNavbarStyle}>
			<Toolbar>
				<IconButton
					className="CNavbarHomeButton"
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
				<CTitle
					size="sm"
					sx={{
						pl: 5,
						flexGrow: 1,
						display: { xs: "none", md: "block" },
					}}
				>
					Guess Tunes
				</CTitle>
				<Stack
					direction="row"
					spacing={{ xs: 1, sm: 1.5, md: 2 }}
					alignItems="center"
					sx={{ ml: "auto" }}
				>
					<CDialogLanguage open={false} />
					{items.map((item, idx) => {
						if (item.kind === "link") {
							if (item.hide) return undefined;
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
						} else if (item.kind === "toggle") {
							return (
								<CNavbarToggle
									key={`${item.aria}-${idx}`}
									aria={item.aria}
									icon={item.icon}
									onClick={item.onClick}
									disabled={item.disabled}
									active={item.active}
									notifCount={item.notifCount}
								/>
							);
						}

						return (
							<CNavbarIcon
								key={`${item.aria}-${idx}`}
								aria={item.aria}
								icon={item.icon}
								onClick={item.onClick}
								disabled={item.disabled}
							/>
						);
					})}
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
