import { useMemo, useState } from 'react';
import {
	Badge,
	Card,
	CollapsibleCard,
	EmptyState,
	InputControl,
	Stack,
	Text,
	ValidityIndicator,
} from '@wordpress/ui';
import { search } from '@wordpress/icons';

/**
 * A reasonable shape for this vendor's API keys: 32-64 alphanumeric
 * characters. Used only to give the user quick, local feedback — the real
 * validity of a key can only be confirmed by the server.
 */
const API_KEY_PATTERN = /^[A-Za-z0-9]{32,64}$/;

const AVAILABLE_INTEGRATIONS = [
	'Google Analytics',
	'Mailchimp',
	'Slack',
	'Stripe',
	'Zapier',
];

type ConnectionStatus = 'connected' | 'disconnected';

export function PluginSettings() {
	const [ apiKey, setApiKey ] = useState( '' );
	const [ connectionStatus ] = useState< ConnectionStatus >( 'connected' );
	const [ integrationQuery, setIntegrationQuery ] = useState( '' );

	const isApiKeyValid = API_KEY_PATTERN.test( apiKey );

	const filteredIntegrations = useMemo( () => {
		const query = integrationQuery.trim().toLowerCase();
		if ( ! query ) {
			return AVAILABLE_INTEGRATIONS;
		}
		return AVAILABLE_INTEGRATIONS.filter( ( integration ) =>
			integration.toLowerCase().includes( query )
		);
	}, [ integrationQuery ] );

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" align="center" justify="space-between">
					<Card.Title>Plugin settings</Card.Title>
					{ /* Small colored label showing the connection status. */ }
					<Badge
						intent={
							connectionStatus === 'connected' ? 'stable' : 'none'
						}
					>
						{ connectionStatus === 'connected'
							? 'Connected'
							: 'Disconnected' }
					</Badge>
				</Stack>
			</Card.Header>

			<Card.Content>
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="xs">
						{ /* Text field for the API key, with a visible label and help text. */ }
						<InputControl
							label="API key"
							description="Find your API key in your account dashboard under Settings > API Keys."
							type="password"
							placeholder="Enter your API key"
							value={ apiKey }
							onValueChange={ ( next ) =>
								setApiKey( next ?? '' )
							}
						/>
						{ /* Inline message saying whether the key's format is valid. */ }
						{ apiKey && (
							<ValidityIndicator
								type={ isApiKeyValid ? 'valid' : 'invalid' }
								message={
									isApiKeyValid
										? 'This looks like a valid API key format.'
										: "This doesn't look like a valid API key. Keys are 32-64 letters and numbers."
								}
							/>
						) }
					</Stack>

					<Stack direction="column" gap="xs">
						<InputControl
							label="Search integrations"
							description="Find an integration to connect to your account."
							placeholder="Search integrations…"
							value={ integrationQuery }
							onValueChange={ ( next ) =>
								setIntegrationQuery( next ?? '' )
							}
						/>

						{ /* Message with an illustration, shown when a search returns no results. */ }
						{ filteredIntegrations.length === 0 ? (
							<EmptyState.Root>
								<EmptyState.Icon icon={ search } />
								<EmptyState.Title>
									No results found
								</EmptyState.Title>
								<EmptyState.Description>
									Try adjusting your search to find the
									integration you&apos;re looking for.
								</EmptyState.Description>
							</EmptyState.Root>
						) : (
							<Stack direction="column" gap="xs" render={ <ul /> }>
								{ filteredIntegrations.map( ( integration ) => (
									<Text
										key={ integration }
										variant="body-md"
										render={ <li /> }
									>
										{ integration }
									</Text>
								) ) }
							</Stack>
						) }
					</Stack>

					{ /* Advanced settings section the user can expand and collapse. */ }
					<CollapsibleCard.Root>
						<CollapsibleCard.Header>
							<Card.Title>Advanced settings</Card.Title>
						</CollapsibleCard.Header>
						<CollapsibleCard.Content>
							<Stack direction="column" gap="md">
								<InputControl
									label="Webhook URL"
									description="Receive real-time event notifications at this endpoint."
									placeholder="https://example.com/webhook"
								/>
								<InputControl
									label="Request timeout (seconds)"
									description="How long to wait for a response before retrying a failed request."
									type="number"
									defaultValue={ 30 }
								/>
							</Stack>
						</CollapsibleCard.Content>
					</CollapsibleCard.Root>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

export default PluginSettings;
