import { useState } from 'react';
import {
	Badge,
	Card,
	CollapsibleCard,
	EmptyState,
	InputControl,
	Stack,
	ValidityIndicator,
} from '@wordpress/ui';
import { Notice } from '@wordpress/components';

// A simple API key looks like "sk-" followed by 32+ alphanumeric characters.
const API_KEY_PATTERN = /^sk-[A-Za-z0-9]{32,}$/;

const CONNECTION_STATUS: 'connected' | 'disconnected' = 'connected';

export function PluginSettings() {
	const [ apiKey, setApiKey ] = useState( '' );
	const [ searchTerm, setSearchTerm ] = useState( '' );

	const hasApiKey = apiKey.length > 0;
	const isApiKeyValid = API_KEY_PATTERN.test( apiKey );

	// The "no results" empty state only appears once the user has actually
	// searched and nothing matched.
	const hasSearched = searchTerm.trim().length > 0;
	const hasSearchResults = false;
	const showNoResults = hasSearched && ! hasSearchResults;

	return (
		<Stack direction="column" gap="xl">
			<Card.Root>
				<Card.Header>
					<Card.Title>Connection</Card.Title>
				</Card.Header>
				<Card.Content>
					<Stack direction="column" gap="lg">
						{ /* Small colored label showing the connection status. */ }
						<Stack direction="row" gap="sm" align="center">
							<span>Status:</span>
							<Badge
								intent={
									CONNECTION_STATUS === 'connected'
										? 'stable'
										: 'high'
								}
							>
								{ CONNECTION_STATUS === 'connected'
									? 'Connected'
									: 'Disconnected' }
							</Badge>
						</Stack>

						{ /* API key text field, with a visible label and help text. */ }
						<InputControl
							label="API key"
							description="Find your API key in your account dashboard under Developer settings."
							type="password"
							value={ apiKey }
							onValueChange={ ( value ) => setApiKey( value ) }
						/>

						{ /* Inline message under the API key field saying whether the
						 * key's format is valid. */ }
						{ hasApiKey && (
							<ValidityIndicator
								type={ isApiKeyValid ? 'valid' : 'invalid' }
								message={
									isApiKeyValid
										? 'This looks like a valid API key.'
										: 'This does not look like a valid API key. Expected format: sk-xxxxxxxx…'
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
					<Stack direction="column" gap="lg">
						<InputControl
							label="Search components"
							description="Search the catalog of available options for this plugin."
							value={ searchTerm }
							onValueChange={ ( value ) =>
								setSearchTerm( value )
							}
						/>

						{ /* Message with an illustration, shown when a search
						 * returns no results. */ }
						{ showNoResults && (
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
											cx="28"
											cy="28"
											r="16"
											stroke="currentColor"
											strokeWidth="3"
										/>
										<line
											x1="39.5"
											y1="39.5"
											x2="52"
											y2="52"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
										/>
									</svg>
								</EmptyState.Visual>
								<EmptyState.Title>
									No results found
								</EmptyState.Title>
								<EmptyState.Description>
									Try a different search term.
								</EmptyState.Description>
							</EmptyState.Root>
						) }

						<Notice status="warning" isDismissible={ false }>
							Changes to advanced settings can affect how the
							plugin connects to the API. Proceed with caution.
						</Notice>
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</Stack>
	);
}

export default PluginSettings;
