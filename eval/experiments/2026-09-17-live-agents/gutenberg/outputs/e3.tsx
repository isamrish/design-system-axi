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
import { notFound } from "@wordpress/icons";

// A plugin API key is expected to be a 32-64 character hex string.
const API_KEY_PATTERN = /^[a-f0-9]{32,64}$/i;

const ADVANCED_SETTINGS = [
	{ name: "Webhook URL", description: "Endpoint notified on every sync." },
	{ name: "Request timeout", description: "Seconds to wait before giving up." },
	{ name: "Debug logging", description: "Write verbose logs to the site log." },
];

export function PluginSettings() {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [connectionStatus] = useState<"connected" | "disconnected">(
		"connected",
	);

	const isApiKeyValid = apiKey.length === 0 ? null : API_KEY_PATTERN.test(apiKey);

	const matchingAdvancedSettings = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) {
			return ADVANCED_SETTINGS;
		}
		return ADVANCED_SETTINGS.filter((setting) =>
			setting.name.toLowerCase().includes(term),
		);
	}, [searchTerm]);

	const hasNoResults =
		searchTerm.trim().length > 0 && matchingAdvancedSettings.length === 0;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>Plugin settings</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{/* Connection status: a small colored label. */}
					<Stack direction="row" gap="sm" align="center">
						<Text variant="body-md">Connection status</Text>
						<Badge intent={connectionStatus === "connected" ? "stable" : "low"}>
							{connectionStatus === "connected" ? "Connected" : "Disconnected"}
						</Badge>
					</Stack>

					{/* API key field with label, help text, and inline validity message. */}
					<Stack direction="column" gap="xs">
						<InputControl
							label="API key"
							description="Find this in your account dashboard under Developer settings."
							type="password"
							value={apiKey}
							onValueChange={(value) => setApiKey(value)}
						/>
						{isApiKeyValid !== null && (
							<ValidityIndicator
								type={isApiKeyValid ? "valid" : "invalid"}
								message={
									isApiKeyValid
										? "This key's format looks valid."
										: "API keys are 32-64 hexadecimal characters."
								}
							/>
						)}
					</Stack>

					{/* Search box over the advanced settings below. */}
					<InputControl
						label="Search settings"
						description="Search advanced settings by name."
						value={searchTerm}
						onValueChange={(value) => setSearchTerm(value)}
					/>

					{/* Empty state with illustration, shown when the search has no matches. */}
					{hasNoResults && (
						<EmptyState.Root>
							<EmptyState.Icon icon={notFound} />
							<EmptyState.Title>No results found</EmptyState.Title>
							<EmptyState.Description>
								Try a different search term, or expand advanced settings to
								browse all of them.
							</EmptyState.Description>
						</EmptyState.Root>
					)}

					{/* Advanced settings: an expandable and collapsible section. */}
					<Collapsible.Root
						open={isAdvancedOpen}
						onOpenChange={setIsAdvancedOpen}
					>
						<Collapsible.Trigger>
							{isAdvancedOpen
								? "Hide advanced settings"
								: "Show advanced settings"}
						</Collapsible.Trigger>
						<Collapsible.Panel>
							<Stack direction="column" gap="md">
								{matchingAdvancedSettings.map((setting) => (
									<Stack direction="column" gap="xs" key={setting.name}>
										<Text variant="body-md">{setting.name}</Text>
										<Text variant="body-sm">{setting.description}</Text>
									</Stack>
								))}
							</Stack>
						</Collapsible.Panel>
					</Collapsible.Root>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

export default PluginSettings;
