import { http, HttpResponse } from "msw";

var LoginHandler = http.post("/api/auth/login", async ({ request }) => {
	const data = await request.json();
	console.log(data);

	return HttpResponse.json({
		id: "abc-123",
		username: "john",
		email: "jhon@42.fr",
	});
});

export default LoginHandler;
