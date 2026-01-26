import { http, HttpResponse } from "msw";

interface Truque {
    email: string;
}

export const handlers = [
    http.post("/api/auth/login", async ({ request }) => {
        const body: Truque = (await request.json()) as Truque;

        return HttpResponse.json({
            id: "abc-123",
            username: body.email,
            email: "jhon@42.fr",
        });
    }),
];
