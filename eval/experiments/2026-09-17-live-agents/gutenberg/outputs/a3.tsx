import { useState } from "react";
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

// A plugin admin screen would normally read this from the API connection
// state; it is modeled here as local state driven by the API key field.
type ConnectionStatus = "connected" | "disconnected";

// Keys look like "sk-" followed by at least 20 alphanumeric/underscore/dash
// characters. Adjust to match the real provider's key format.
const API_KEY_PATTERN = /^sk-[A-Za-z0-9_-]{20,}$/;

const ADVANCED_SETTINGS = [ "Debug mode", "Webhook URL", "Request timeout", "Log level" ];

export function PluginSettings() {
	const [ apiKey, setApiKey ] = useState( "" );
	const [ advancedSearch, setAdvancedSearch ] = useState( "" );

	const connectionStatus: ConnectionStatus = apiKey.length > 0 ? "connected" : "disconnected";
	const isApiKeyValid = API_KEY_PATTERN.test( apiKey );

	const matchingSettings = ADVANCED_SETTINGS.filter( ( setting ) =>
		setting.toLowerCase().includes( advancedSearch.toLowerCase() )
	);
	const hasNoSearchResults = advancedSearch.length > 0 && matchingSettings.length === 0;

	return (
		<Stack direction="column" gap="xl">
			<Card.Root>
				<Card.Header>
					<Stack direction="row" justify="space-between" align="center">
						<Card.Title>Connection</Card.Title>
						{ /* Small colored label showing the connection status. */ }
						<Badge intent={ connectionStatus === "connected" ? "stable" : "none" }>
							{ connectionStatus === "connected" ? "Connected" : "Not connected" }
						</Badge>
					</Stack>
				</Card.Header>
				<Card.Content>
					<Stack direction="column" gap="sm" align="flex-start">
						{ /* Text field for the API key, with a visible label and help text. */ }
						<InputControl
							label="API key"
							description="Find this in your account dashboard under Developer settings. It is required to connect the plugin to your account."
							type="password"
							value={ apiKey }
							onValueChange={ ( value: string ) => setApiKey( value ) }
							placeholder="sk-..."
						/>
						{ /* Inline message under the API key field about the key's format validity. */ }
						{ apiKey.length > 0 && (
							<ValidityIndicator
								type={ isApiKeyValid ? "valid" : "invalid" }
								message={
									isApiKeyValid
										? "This key's format looks valid."
										: "This doesn't look like a valid API key. Keys start with \"sk-\" followed by at least 20 characters."
								}
							/>
						) }
					</Stack>
				</Card.Content>
			</Card.Root>

			{ /* Advanced settings section the user can expand and collapse. */ }
			<CollapsibleCard.Root>
				<CollapsibleCard.Header>
					<Card.Title>Advanced settings</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="md">
						<InputControl
							label="Search advanced settings"
							description="Filter the list below by setting name."
							value={ advancedSearch }
							onValueChange={ ( value: string ) => setAdvancedSearch( value ) }
							placeholder="Search settings…"
						/>

						{ hasNoSearchResults ? (
							// Message with an illustration, shown when a search returns no results.
							<EmptyState.Root>
								<EmptyState.Visual>
									<svg
										width="48"
										height="48"
										viewBox="0 0 48 48"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<circle cx="21" cy="21" r="13" stroke="currentColor" strokeWidth="3" />
										<line
											x1="30.5"
											y1="30.5"
											x2="40"
											y2="40"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
										/>
									</svg>
								</EmptyState.Visual>
								<EmptyState.Title>No settings found</EmptyState.Title>
								<EmptyState.Description>
									Try a different search term, such as “{ ADVANCED_SETTINGS[ 0 ] }” or “
									{ ADVANCED_SETTINGS[ 1 ] }”.
								</EmptyState.Description>
							</EmptyState.Root>
						) : (
							<Stack direction="column" gap="xs">
								{ matchingSettings.map( ( setting ) => (
									<Text key={ setting }>{ setting }</Text>
								) ) }
							</Stack>
						) }
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</Stack>
	);
}

export default PluginSettings;
