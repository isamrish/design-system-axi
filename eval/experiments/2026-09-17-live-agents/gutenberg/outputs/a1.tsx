import { useMemo, useState } from "react";
import { SearchControl } from "@wordpress/components";
import {
	Badge,
	Card,
	CollapsibleCard,
	EmptyState,
	InputControl,
	Stack,
	Text,
	ValidityIndicator,
} from "@wordpress/ui";

// A key must look like "sk-" followed by at least 16 alphanumeric/underscore/hyphen characters.
const API_KEY_PATTERN = /^sk-[A-Za-z0-9_-]{16,}$/;

type ConnectionStatus = "connected" | "disconnected";

interface AdvancedSetting {
	label: string;
	description: string;
}

const ADVANCED_SETTINGS: AdvancedSetting[] = [
	{
		label: "Webhook URL",
		description: "Receive account events at this endpoint.",
	},
	{
		label: "Request timeout",
		description: "How long to wait for the API before giving up, in seconds.",
	},
	{
		label: "Debug logging",
		description: "Write verbose request and response details to the log.",
	},
];

export function PluginSettings() {
	const [apiKey, setApiKey] = useState("");
	const [connectionStatus] = useState<ConnectionStatus>("connected");
	const [settingsQuery, setSettingsQuery] = useState("");

	const isApiKeyValid = API_KEY_PATTERN.test(apiKey);

	const filteredAdvancedSettings = useMemo(() => {
		const query = settingsQuery.trim().toLowerCase();
		if (!query) {
			return ADVANCED_SETTINGS;
		}
		return ADVANCED_SETTINGS.filter((setting) =>
			setting.label.toLowerCase().includes(query),
		);
	}, [settingsQuery]);

	return (
		<Stack direction="column" gap="xl">
			<Stack direction="row" gap="md" align="center" justify="space-between">
				<Text variant="heading-lg">Plugin settings</Text>
				<Badge intent={connectionStatus === "connected" ? "stable" : "low"}>
					{connectionStatus === "connected" ? "Connected" : "Disconnected"}
				</Badge>
			</Stack>

			<Stack direction="column" gap="xs">
				<InputControl
					label="API key"
					description="Find your API key in your account dashboard under Developer settings."
					type="password"
					value={apiKey}
					onValueChange={(value) => setApiKey(value)}
					placeholder="sk-..."
				/>
				<ValidityIndicator
					type={apiKey.length === 0 ? "validating" : isApiKeyValid ? "valid" : "invalid"}
					message={
						apiKey.length === 0
							? "Enter your API key to verify its format."
							: isApiKeyValid
								? "This key's format looks valid."
								: "This key's format looks invalid. It should start with \"sk-\" followed by at least 16 characters."
					}
				/>
			</Stack>

			<CollapsibleCard.Root>
				<CollapsibleCard.Header>
					<Card.Title>Advanced settings</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="lg">
						<SearchControl
							label="Filter advanced settings"
							placeholder="Search advanced settings…"
							value={settingsQuery}
							onChange={(value) => setSettingsQuery(value)}
							help="Search by setting name."
							__nextHasNoMarginBottom
						/>

						{filteredAdvancedSettings.length === 0 ? (
							<EmptyState.Root>
								<EmptyState.Visual>
									<svg
										width="64"
										height="64"
										viewBox="0 0 64 64"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										aria-hidden="true"
									>
										<circle
											cx="27"
											cy="27"
											r="16"
											stroke="currentColor"
											strokeWidth="3"
										/>
										<line
											x1="38.5"
											y1="38.5"
											x2="50"
											y2="50"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
										/>
									</svg>
								</EmptyState.Visual>
								<EmptyState.Title>No results found</EmptyState.Title>
								<EmptyState.Description>
									Try a different search term to find the advanced setting
									you&apos;re looking for.
								</EmptyState.Description>
							</EmptyState.Root>
						) : (
							<Stack direction="column" gap="md">
								{filteredAdvancedSettings.map((setting) => (
									<Text key={setting.label} variant="body-md">
										<strong>{setting.label}</strong> — {setting.description}
									</Text>
								))}
							</Stack>
						)}
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</Stack>
	);
}

export default PluginSettings;
