import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PPrivacyPolicy, PTermsOfService } from "../pages/static";

describe("Static policy pages", () => {
	it("renders substantive privacy policy sections", () => {
		render(
			<MemoryRouter initialEntries={["/privacy-policy"]}>
				<PPrivacyPolicy />
			</MemoryRouter>,
		);

		expect(screen.getByRole("heading", { name: "PRIVACY_POLICY" })).toBeInTheDocument();
		expect(screen.getByText("PRIVACY_INTRO")).toBeInTheDocument();
		expect(screen.getByText("PRIVACY_DATA_TITLE")).toBeInTheDocument();
		expect(screen.getByText("PRIVACY_USAGE_TITLE")).toBeInTheDocument();
		expect(screen.getByText("PRIVACY_SHARING_TITLE")).toBeInTheDocument();
		expect(screen.getByText("PRIVACY_RETENTION_TITLE")).toBeInTheDocument();
		expect(screen.getByText("PRIVACY_RIGHTS_TITLE")).toBeInTheDocument();
		expect(screen.queryByText("Privacy policy page")).not.toBeInTheDocument();
	});

	it("renders substantive terms of service sections", () => {
		render(
			<MemoryRouter initialEntries={["/terms-of-service"]}>
				<PTermsOfService />
			</MemoryRouter>,
		);

		expect(screen.getByRole("heading", { name: "TERMS_OF_SERVICE" })).toBeInTheDocument();
		expect(screen.getByText("TERMS_INTRO")).toBeInTheDocument();
		expect(screen.getByText("TERMS_ACCOUNTS_TITLE")).toBeInTheDocument();
		expect(screen.getByText("TERMS_CONDUCT_TITLE")).toBeInTheDocument();
		expect(screen.getByText("TERMS_SERVICE_TITLE")).toBeInTheDocument();
		expect(screen.getByText("TERMS_CONTENT_TITLE")).toBeInTheDocument();
		expect(screen.getByText("TERMS_ENFORCEMENT_TITLE")).toBeInTheDocument();
		expect(screen.getByText("TERMS_CHANGES_TITLE")).toBeInTheDocument();
		expect(screen.queryByText("Terms of service page")).not.toBeInTheDocument();
	});
});
