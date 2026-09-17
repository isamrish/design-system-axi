import { useMemo, useState } from "react";
import { SearchControl } from "@wordpress/components";
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

/**
 * Only letters, numbers, hyphens, and underscores, 20-64 characters long.
 * Adjust to match the real provider's key format when one is wired up.
 */
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

type ConnectionStatus = "connected" | "disconnected";

type SettingSectionId = "connection" | "apiKey" | "advanced";

type SettingSection = {
	id: SettingSectionId;
	label: string;
	keywords: string[];
};

const SETTINGS_SECTIONS: SettingSection[] = [
	{
		id: "connection",
		label: "Connection status",
		keywords: [ "connection", "status", "connected", "disconnected" ],
	},
	{
		id: "apiKey",
		label: "API key",
		keywords: [ "api", "key", "token", "credential", "auth" ],
	},
	{
		id: "advanced",
		label: "Advanced settings",
		keywords: [ "advanced", "endpoint", "debug", "developer" ],
	},
];

export function PluginSettings() {
	const [ searchQuery, setSearchQuery ] = useState( "" );
	const [ apiKey, setApiKey ] = useState( "" );
	const [ advancedOpen, setAdvancedOpen ] = useState( false );
	const [ endpoint, setEndpoint ] = useState( "" );

	// Mocked until this is wired up to a real connection check.
	const [ connectionStatus ] = useState< ConnectionStatus >( "connected" );

	const normalizedQuery = searchQuery.trim().toLowerCase();

	const visibleSections = useMemo( () => {
		if ( ! normalizedQuery ) {
			return SETTINGS_SECTIONS;
		}

		return SETTINGS_SECTIONS.filter(
			( section ) =>
				section.label.toLowerCase().includes( normalizedQuery ) ||
				section.keywords.some( ( keyword ) =>
					keyword.includes( normalizedQuery )
				)
		);
	}, [ normalizedQuery ] );

	const isSectionVisible = ( id: SettingSectionId ) =>
		visibleSections.some( ( section ) => section.id === id );

	const trimmedApiKey = apiKey.trim();
	const isApiKeyFormatValid = API_KEY_PATTERN.test( trimmedApiKey );

	return (
		<Card.Root>
			<Card.Content>
				<Stack gap="lg">
					<Stack gap="xs">
						<Text variant="heading-lg" render={ <h2 /> }>
							Plugin settings
						</Text>
						<Text variant="body-md">
							Configure the connection between this plugin and
							your account.
						</Text>
					</Stack>

					<SearchControl
						label="Search settings"
						placeholder="Search settings"
						value={ searchQuery }
						onChange={ setSearchQuery }
						hideLabelFromVision={ false }
					/>

					{ visibleSections.length === 0 ? (
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
										x1="38.3"
										y1="38.3"
										x2="53"
										y2="53"
										stroke="currentColor"
										strokeWidth="3"
										strokeLinecap="round"
									/>
								</svg>
							</EmptyState.Visual>
							<EmptyState.Title>
								No settings found
							</EmptyState.Title>
							<EmptyState.Description>
								Nothing matches &ldquo;{ searchQuery }&rdquo;.
								Try a different search term.
							</EmptyState.Description>
						</EmptyState.Root>
					) : (
						<Stack gap="lg">
							{ isSectionVisible( "connection" ) && (
								<Stack
									direction="row"
									align="center"
									gap="sm"
								>
									<Text
										variant="body-md"
										style={ { fontWeight: 600 } }
									>
										Connection status
									</Text>
									<Badge
										intent={
											connectionStatus === "connected"
												? "stable"
												: "high"
										}
									>
										{ connectionStatus === "connected"
											? "Connected"
											: "Disconnected" }
									</Badge>
								</Stack>
							) }

							{ isSectionVisible( "apiKey" ) && (
								<Stack gap="xs">
									<InputControl
										label="API key"
										description="Find this in your account's API settings. It's stored locally and never shared."
										value={ apiKey }
										onValueChange={ ( value ) =>
											setApiKey( value )
										}
										placeholder="Enter your API key"
									/>
									{ trimmedApiKey.length > 0 && (
										<ValidityIndicator
											type={
												isApiKeyFormatValid
													? "valid"
													: "invalid"
											}
											message={
												isApiKeyFormatValid
													? "This key's format looks valid."
													: "API keys are 20-64 letters, numbers, hyphens, or underscores."
											}
										/>
									) }
								</Stack>
							) }

							{ isSectionVisible( "advanced" ) && (
								<Collapsible.Root
									open={ advancedOpen }
									onOpenChange={ ( open ) =>
										setAdvancedOpen( open )
									}
								>
									<Collapsible.Trigger>
										{ advancedOpen
											? "Hide advanced settings"
											: "Show advanced settings" }
									</Collapsible.Trigger>
									<Collapsible.Panel>
										<Stack gap="md">
											<InputControl
												label="Custom API endpoint"
												description="Override the default API host. Leave blank to use the default."
												value={ endpoint }
												onValueChange={ ( value ) =>
													setEndpoint( value )
												}
												placeholder="https://api.example.com"
											/>
										</Stack>
									</Collapsible.Panel>
								</Collapsible.Root>
							) }
						</Stack>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

export default PluginSettings;
