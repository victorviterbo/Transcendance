import { useState, type FormEvent } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

const getErrorMessage = async (response: Response, fallback: string) => {
    try {
        const data = (await response.json()) as {
            error?: string;
            errors?: Record<string, string>;
        };
        if (data.error) {
            return data.error;
        }
        if (data.errors) {
            const messages = Object.values(data.errors).filter(Boolean);
            if (messages.length > 0) {
                return messages.join(", ");
            }
        }
        return fallback;
    } catch {
        return fallback;
    }
};

type AuthUser = {
    id: number;
    username: string;
    email: string;
};

type Props = {
    onSuccess?: (user: AuthUser) => void;
};

const RegisterForm = ({ onSuccess }: Props) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const passwordsMatch = password === confirmPassword;
    const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (!passwordsMatch || isSubmitting) {
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Prefer: "code=409, example=username-taken",
                },
                body: JSON.stringify({ username, email, password }),
            });
            if (!response.ok) {
                const message = await getErrorMessage(response, "Registration failed.");
                setError(message);
                return;
            }
            const user = (await response.json()) as AuthUser;
            console.log("Register success:", user);
            onSuccess?.(user);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleRegister}>
            <TextField
                label="Username"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />

            <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                margin="normal"
                error={showMismatch}
                helperText={showMismatch ? "Passwords do not match" : " "}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />

            {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                </Typography>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={!passwordsMatch || isSubmitting}
            >
                {isSubmitting ? "Registering..." : "Register"}
            </Button>
        </Box>
    );
};

export default RegisterForm;
