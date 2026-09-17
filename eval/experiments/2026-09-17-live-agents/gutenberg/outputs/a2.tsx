import React, { useMemo, useState } from "react";
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
import { SearchControl } from "@wordpress/components";

type ConnectionStatus = "connected" | "disconnected";

interface SettingsSection {
	id: "connection" | "api-key" | "advanced";
	label: string;
	keywords: string[];
}

const SECTIONS: SettingsSection[] = [
	{
		id: "connection",
		label: "Connection status",
		keywords: [ "connection", "status", "connected" ],
	},
	{
		id: "api-key",
		label: "API key",
		keywords: [ "api", "key", "token", "auth", "credential" ],
	},
	{
		id: "advanced",
		label: "Advanced settings",
		keywords: [ "advanced", "debug", "developer" ],
	},
];

// A real API key is expected to be a long alphanumeric token; this is a
// stand-in shape check, not a call to the service that issued the key.
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

interface PluginSettingsProps {
	connectionStatus?: ConnectionStatus;
}

export function PluginSettings( {
	connectionStatus = "connected",
}: PluginSettingsProps ) {
	const [ settingsQuery, setSettingsQuery ] = useState( "" );
	const [ apiKey, setApiKey ] = useState( "" );

	const visibleSections = useMemo( () => {
		const query = settingsQuery.trim().toLowerCase();
		if ( ! query ) {
			return SECTIONS;
		}
		return SECTIONS.filter(
			( section ) =>
				section.label.toLowerCase().includes( query ) ||
				section.keywords.some( ( keyword ) => keyword.includes( query ) )
		);
	}, [ settingsQuery ] );

	const isSectionVisible = ( id: SettingsSection[ "id" ] ) =>
		visibleSections.some( ( section ) => section.id === id );

	const isApiKeyValid = apiKey.length === 0 || API_KEY_PATTERN.test( apiKey );

	return (
		<Stack direction="column" gap="xl">
			<Text variant="heading-lg" render={ <h1 /> }>
				Plugin settings
			</Text>

			<SearchControl
				label="Search settings"
				placeholder="Search settings"
				value={ settingsQuery }
				onChange={ setSettingsQuery }
				help="Filter the sections below by name, e.g. &quot;API&quot; or &quot;advanced&quot;."
				__nextHasNoMarginBottom
			/>

			{ visibleSections.length === 0 && (
				<EmptyState.Root>
					<EmptyState.Visual>
						<svg
							width="64"
							height="64"
							viewBox="0 0 64 64"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
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
								x2="54"
								y2="54"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinecap="round"
							/>
						</svg>
					</EmptyState.Visual>
					<EmptyState.Title>No settings found</EmptyState.Title>
					<EmptyState.Description>
						{ `We couldn't find any settings matching "${ settingsQuery }". Try a different search term.` }
					</EmptyState.Description>
				</EmptyState.Root>
			) }

			{ isSectionVisible( "connection" ) && (
				<Stack direction="row" align="center" gap="sm">
					<Text variant="body-md">Connection status:</Text>
					<Badge
						intent={
							connectionStatus === "connected" ? "stable" : "high"
						}
					>
						{ connectionStatus === "connected"
							? "Connected"
							: "Disconnected" }
					</Badge>
				</Stack>
			) }

			{ isSectionVisible( "api-key" ) && (
				<Stack direction="column" gap="xs">
					<InputControl
						label="API key"
						description="Find your API key in your account dashboard under Integrations."
						placeholder="Enter your API key"
						type="password"
						value={ apiKey }
						onValueChange={ ( value ) => setApiKey( value ) }
					/>
					{ apiKey.length > 0 && (
						<ValidityIndicator
							type={ isApiKeyValid ? "valid" : "invalid" }
							message={
								isApiKeyValid
									? "This looks like a valid API key format."
									: "This doesn't look like a valid API key. Keys are at least 20 characters (letters, numbers, - or _)."
							}
						/>
					) }
				</Stack>
			) }

			{ isSectionVisible( "advanced" ) && (
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Advanced settings</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Text render={ <p /> }>
							Advanced configuration options for this plugin go
							here. This section is collapsed by default so the
							common settings above stay in view.
						</Text>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			) }
		</Stack>
	);
}

export default PluginSettings;
