import { useMemo, useState } from "react";
import { SearchControl } from "@wordpress/components";
import {
	Badge,
	Collapsible,
	EmptyState,
	InputControl,
	ValidityIndicator,
} from "@wordpress/ui";

// A plugin is either connected or not; drive the status label from that.
const CONNECTION_STATUS: "connected" | "disconnected" = "connected";

const ADVANCED_SETTINGS = [
	{ id: "cache", label: "Enable response caching" },
	{ id: "debug", label: "Verbose debug logging" },
	{ id: "webhooks", label: "Outgoing webhook retries" },
	{ id: "timeout", label: "Request timeout override" },
];

// Loose sanity check: most vendor API keys are long, unspaced, alphanumeric
// (allowing - and _) tokens. This is a format check, not a live verification.
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

export function PluginSettings() {
	const [advancedQuery, setAdvancedQuery] = useState("");
	const [apiKey, setApiKey] = useState("");

	const filteredAdvancedSettings = useMemo(
		() =>
			ADVANCED_SETTINGS.filter((setting) =>
				setting.label.toLowerCase().includes(advancedQuery.toLowerCase()),
			),
		[advancedQuery],
	);

	const apiKeyValidity: "valid" | "invalid" | undefined =
		apiKey.length === 0 ? undefined : API_KEY_PATTERN.test(apiKey) ? "valid" : "invalid";

	return (
		<div className="plugin-settings">
			<h2>Plugin settings</h2>

			<div className="plugin-settings__field">
				<InputControl
					label="API key"
					description="Find this in your account dashboard under API access. Required to sync data."
					value={apiKey}
					onValueChange={(value) => setApiKey(value)}
					type="password"
				/>
				{apiKeyValidity && (
					<ValidityIndicator
						type={apiKeyValidity}
						message={
							apiKeyValidity === "valid"
								? "This looks like a valid API key."
								: "This doesn't look like a valid API key format."
						}
					/>
				)}
			</div>

			<div className="plugin-settings__status">
				<span>Connection status: </span>
				<Badge intent={CONNECTION_STATUS === "connected" ? "stable" : "low"}>
					{CONNECTION_STATUS === "connected" ? "Connected" : "Disconnected"}
				</Badge>
			</div>

			<Collapsible.Root>
				<Collapsible.Trigger>Advanced settings</Collapsible.Trigger>
				<Collapsible.Panel>
					<SearchControl
						label="Search advanced settings"
						value={advancedQuery}
						onChange={setAdvancedQuery}
					/>

					{filteredAdvancedSettings.length > 0 ? (
						<ul>
							{filteredAdvancedSettings.map((setting) => (
								<li key={setting.id}>{setting.label}</li>
							))}
						</ul>
					) : (
						<EmptyState.Root>
							<EmptyState.Visual>
								<svg
									width="48"
									height="48"
									viewBox="0 0 48 48"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<circle
										cx="20"
										cy="20"
										r="12"
										stroke="currentColor"
										strokeWidth="3"
									/>
									<line
										x1="29"
										y1="29"
										x2="41"
										y2="41"
										stroke="currentColor"
										strokeWidth="3"
										strokeLinecap="round"
									/>
								</svg>
							</EmptyState.Visual>
							<EmptyState.Title>No settings found</EmptyState.Title>
							<EmptyState.Description>
								Try a different search term.
							</EmptyState.Description>
						</EmptyState.Root>
					)}
				</Collapsible.Panel>
			</Collapsible.Root>
		</div>
	);
}
