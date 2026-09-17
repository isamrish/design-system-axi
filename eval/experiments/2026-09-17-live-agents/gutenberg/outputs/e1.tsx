import { useMemo, useState } from "react";
import {
	Badge,
	Card,
	Collapsible,
	EmptyState,
	InputControl,
	Stack,
	Text,
	ValidityIndicator,
} from "@wordpress/ui";
import { Button } from "@wordpress/components";

// A plausible format for the API key this plugin expects: a "sk-" prefix
// followed by at least 20 alphanumeric/underscore/hyphen characters.
const API_KEY_PATTERN = /^sk-[A-Za-z0-9_-]{20,}$/;

const ADVANCED_SETTINGS = [
	{ name: "Request timeout (seconds)", description: "How long to wait before an API call is considered failed." },
	{ name: "Retry attempts", description: "Number of times to retry a failed request before giving up." },
	{ name: "Webhook URL", description: "Endpoint that receives async event notifications from the API." },
	{ name: "Debug logging", description: "Write verbose request and response details to the plugin log." },
];

export function PluginSettings() {
	const [apiKey, setApiKey] = useState("");
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [advancedSearch, setAdvancedSearch] = useState("");
	const [connectionStatus] = useState<"connected" | "disconnected">("connected");

	const apiKeyValidity: "valid" | "invalid" | undefined =
		apiKey.length === 0 ? undefined : API_KEY_PATTERN.test(apiKey) ? "valid" : "invalid";

	const filteredAdvancedSettings = useMemo(() => {
		const query = advancedSearch.trim().toLowerCase();
		if (!query) {
			return ADVANCED_SETTINGS;
		}
		return ADVANCED_SETTINGS.filter((setting) =>
			setting.name.toLowerCase().includes(query),
		);
	}, [advancedSearch]);

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" align="center" justify="space-between">
					<Card.Title>Plugin settings</Card.Title>
					<Badge intent={connectionStatus === "connected" ? "stable" : "none"}>
						{connectionStatus === "connected" ? "Connected" : "Disconnected"}
					</Badge>
				</Stack>
			</Card.Header>

			<Card.Content>
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="xs">
						<InputControl
							label="API key"
							description="Find this in your account dashboard under API access. It should start with “sk-”."
							placeholder="sk-..."
							type="password"
							value={apiKey}
							onValueChange={(value) => setApiKey(value)}
						/>
						{apiKeyValidity && (
							<ValidityIndicator
								type={apiKeyValidity}
								message={
									apiKeyValidity === "valid"
										? "This looks like a valid API key."
										: "This doesn't match the expected API key format (sk-... followed by 20+ characters)."
								}
							/>
						)}
					</Stack>

					<Collapsible.Root open={advancedOpen} onOpenChange={setAdvancedOpen}>
						<Collapsible.Trigger>
							<Text variant="heading-sm">
								{advancedOpen ? "Hide advanced settings" : "Show advanced settings"}
							</Text>
						</Collapsible.Trigger>
						<Collapsible.Panel>
							<Stack direction="column" gap="md">
								<InputControl
									label="Search advanced settings"
									description="Filter the list below by setting name."
									placeholder="e.g. timeout"
									value={advancedSearch}
									onValueChange={(value) => setAdvancedSearch(value)}
								/>

								{filteredAdvancedSettings.length > 0 ? (
									<Stack direction="column" gap="sm">
										{filteredAdvancedSettings.map((setting) => (
											<Stack direction="column" gap="xs" key={setting.name}>
												<Text variant="heading-sm">{setting.name}</Text>
												<Text variant="body-sm">{setting.description}</Text>
											</Stack>
										))}
									</Stack>
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
													r="13"
													stroke="currentColor"
													strokeWidth="2.5"
												/>
												<line
													x1="29.5"
													y1="29.5"
													x2="41"
													y2="41"
													stroke="currentColor"
													strokeWidth="2.5"
													strokeLinecap="round"
												/>
											</svg>
										</EmptyState.Visual>
										<EmptyState.Title>No settings found</EmptyState.Title>
										<EmptyState.Description>
											No advanced settings match “{advancedSearch}”. Try a different
											search term.
										</EmptyState.Description>
										<EmptyState.Actions>
											<Button
												variant="tertiary"
												onClick={() => setAdvancedSearch("")}
											>
												Clear search
											</Button>
										</EmptyState.Actions>
									</EmptyState.Root>
								)}
							</Stack>
						</Collapsible.Panel>
					</Collapsible.Root>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

export default PluginSettings;
