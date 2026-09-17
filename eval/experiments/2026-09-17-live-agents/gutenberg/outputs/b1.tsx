import { useMemo, useState } from "react";
import { SearchControl } from "@wordpress/components";
import {
	Badge,
	Card,
	CollapsibleCard,
	EmptyState,
	InputControl,
	Stack,
	ValidityIndicator,
} from "@wordpress/ui";

// Settings a user can look up in the search box below. In a real plugin this
// would likely come from a registry of setting definitions.
const SEARCHABLE_SETTINGS = [
	"API key",
	"Webhook URL",
	"Cache duration",
	"Debug logging",
	"Retry attempts",
];

// A conservative shape check for the third-party API key: 32-64 characters,
// letters, numbers, hyphens, or underscores.
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;

function NoResultsIllustration() {
	return (
		<svg
			width="64"
			height="64"
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<circle cx="27" cy="27" r="16" stroke="currentColor" strokeWidth="3" />
			<line
				x1="38.5"
				y1="38.5"
				x2="53"
				y2="53"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function PluginSettings() {
	const [searchTerm, setSearchTerm] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [advancedOpen, setAdvancedOpen] = useState(false);

	const searchResults = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) {
			return SEARCHABLE_SETTINGS;
		}
		return SEARCHABLE_SETTINGS.filter((setting) =>
			setting.toLowerCase().includes(query),
		);
	}, [searchTerm]);

	const hasNoResults = searchTerm.trim().length > 0 && searchResults.length === 0;

	const apiKeyValidity = useMemo(() => {
		if (apiKey.length === 0) {
			return null;
		}
		return API_KEY_PATTERN.test(apiKey)
			? {
					type: "valid" as const,
					message: "This looks like a valid API key.",
				}
			: {
					type: "invalid" as const,
					message:
						"API keys are 32-64 characters: letters, numbers, hyphens, or underscores.",
				};
	}, [apiKey]);

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="row" gap="sm" align="center">
				<h1>Plugin settings</h1>
				<Badge intent="stable">Connected</Badge>
			</Stack>

			<SearchControl
				label="Search settings"
				placeholder="Search settings"
				value={searchTerm}
				onChange={setSearchTerm}
			/>

			{hasNoResults ? (
				<EmptyState.Root>
					<EmptyState.Visual>
						<NoResultsIllustration />
					</EmptyState.Visual>
					<EmptyState.Title>No results found</EmptyState.Title>
					<EmptyState.Description>
						{`We couldn't find any settings matching "${searchTerm}". Try a different search term.`}
					</EmptyState.Description>
				</EmptyState.Root>
			) : null}

			<Stack direction="column" gap="xs">
				<InputControl
					label="API key"
					description="Find your API key in your account dashboard under Developer settings."
					type="password"
					value={apiKey}
					onValueChange={setApiKey}
				/>
				{apiKeyValidity ? (
					<ValidityIndicator
						type={apiKeyValidity.type}
						message={apiKeyValidity.message}
					/>
				) : null}
			</Stack>

			<CollapsibleCard.Root open={advancedOpen} onOpenChange={setAdvancedOpen}>
				<CollapsibleCard.Header>
					<Card.Title>Advanced settings</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="md">
						<InputControl
							label="Webhook URL"
							description="We'll send event notifications to this URL."
							type="url"
						/>
						<InputControl
							label="Retry attempts"
							description="Number of times to retry a failed request before giving up."
							type="number"
						/>
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</Stack>
	);
}
