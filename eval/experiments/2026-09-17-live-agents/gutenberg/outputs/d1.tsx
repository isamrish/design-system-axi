import { useMemo, useState } from 'react';
import { Placeholder, TextControl, Notice } from '@wordpress/components';
import { CollapsibleCard, Card, Badge } from '@wordpress/ui';

// A plugin's own API keys typically look like `sk-` followed by 20+
// alphanumeric characters; adjust to match the real provider's format.
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

type ConnectionStatus = 'connected' | 'disconnected';

function ConnectionStatusBadge( { status }: { status: ConnectionStatus } ) {
	if ( status === 'connected' ) {
		return <Badge intent="stable">Connected</Badge>;
	}

	return <Badge intent="none">Disconnected</Badge>;
}

export function PluginSettings() {
	const [ apiKey, setApiKey ] = useState( '' );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const connectionStatus: ConnectionStatus = apiKey ? 'connected' : 'disconnected';

	const isApiKeyValid = useMemo(
		() => API_KEY_PATTERN.test( apiKey ),
		[ apiKey ]
	);

	// Stand-in for whatever this settings screen actually searches
	// (e.g. a list of integrations or advanced options).
	const searchResults = useMemo(
		() =>
			searchTerm
				? [ 'Webhook URL', 'Retry attempts', 'Request timeout' ].filter(
						( label ) =>
							label.toLowerCase().includes( searchTerm.toLowerCase() )
				  )
				: [],
		[ searchTerm ]
	);

	return (
		<div className="plugin-settings">
			<Card.Root>
				<Card.Header>
					<Card.Title>Plugin settings</Card.Title>
				</Card.Header>

				<Card.Content>
					<div className="plugin-settings__connection-status">
						<ConnectionStatusBadge status={ connectionStatus } />
					</div>

					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label="API key"
						help="Find your API key in your account dashboard under Integrations."
						value={ apiKey }
						onChange={ setApiKey }
						type="text"
						autoComplete="off"
					/>

					{ apiKey &&
						( isApiKeyValid ? (
							<Notice status="success" isDismissible={ false }>
								This looks like a valid API key format.
							</Notice>
						) : (
							<Notice status="error" isDismissible={ false }>
								This doesn&apos;t look like a valid API key format.
							</Notice>
						) ) }

					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label="Search settings"
						help="Search for an advanced option by name."
						value={ searchTerm }
						onChange={ setSearchTerm }
						type="search"
					/>

					{ searchTerm && searchResults.length === 0 && (
						<Placeholder
							withIllustration
							label="No results found"
							instructions={ `We couldn't find any settings matching "${ searchTerm }".` }
						/>
					) }
				</Card.Content>
			</Card.Root>

			<CollapsibleCard.Root>
				<CollapsibleCard.Header render={ <h2 /> }>
					<Card.Title>Advanced settings</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<p>
						Advanced options for this plugin will appear here. Only
						change these if you know what you&apos;re doing.
					</p>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</div>
	);
}

export default PluginSettings;
