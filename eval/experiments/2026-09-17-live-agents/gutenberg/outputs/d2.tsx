import { useMemo, useState } from 'react';
import { TextControl, SearchControl, SVG, Circle, Path } from '@wordpress/components';
import { Card, CollapsibleCard, EmptyState, Badge, ValidityIndicator } from '@wordpress/ui';

type ConnectionStatus = 'connected' | 'disconnected';

interface AdvancedOption {
	id: string;
	label: string;
	description: string;
}

const ADVANCED_OPTIONS: AdvancedOption[] = [
	{
		id: 'debug-mode',
		label: 'Debug mode',
		description: 'Log verbose diagnostic information for troubleshooting.',
	},
	{
		id: 'cache-ttl',
		label: 'Cache TTL',
		description: 'How long API responses are cached, in seconds.',
	},
	{
		id: 'webhook-url',
		label: 'Webhook URL',
		description: 'Endpoint notified whenever a sync completes.',
	},
	{
		id: 'retry-limit',
		label: 'Retry limit',
		description: 'Maximum number of retry attempts for failed requests.',
	},
];

// A valid key is a 32-64 character alphanumeric string.
const API_KEY_PATTERN = /^[A-Za-z0-9]{32,64}$/;

/**
 * Settings screen for the plugin's admin page.
 */
export function PluginSettings() {
	const [ connectionStatus ] = useState< ConnectionStatus >( 'connected' );
	const [ apiKey, setApiKey ] = useState( '' );
	const [ advancedSearch, setAdvancedSearch ] = useState( '' );

	const apiKeyValidity = useMemo( () => {
		if ( ! apiKey ) {
			return null;
		}
		return API_KEY_PATTERN.test( apiKey ) ? 'valid' : 'invalid';
	}, [ apiKey ] );

	const filteredAdvancedOptions = useMemo( () => {
		const query = advancedSearch.trim().toLowerCase();
		if ( ! query ) {
			return ADVANCED_OPTIONS;
		}
		return ADVANCED_OPTIONS.filter(
			( option ) =>
				option.label.toLowerCase().includes( query ) ||
				option.description.toLowerCase().includes( query )
		);
	}, [ advancedSearch ] );

	return (
		<div className="plugin-settings">
			<div className="plugin-settings__connection">
				<Card.Title>Connection status</Card.Title>
				<Badge intent={ connectionStatus === 'connected' ? 'stable' : 'high' }>
					{ connectionStatus === 'connected' ? 'Connected' : 'Disconnected' }
				</Badge>
			</div>

			<TextControl
				label="API key"
				help="Find this in your account dashboard under API access. It authenticates requests to the remote service."
				type="password"
				value={ apiKey }
				onChange={ setApiKey }
				__nextHasNoMarginBottom
			/>
			{ apiKeyValidity && (
				<ValidityIndicator
					type={ apiKeyValidity }
					message={
						apiKeyValidity === 'valid'
							? 'This key is formatted correctly.'
							: 'This does not look like a valid API key. Keys are 32-64 alphanumeric characters.'
					}
				/>
			) }

			<CollapsibleCard.Root>
				<CollapsibleCard.Header>
					<Card.Title>Advanced settings</Card.Title>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<SearchControl
						label="Search advanced settings"
						placeholder="Search advanced settings"
						value={ advancedSearch }
						onChange={ setAdvancedSearch }
						__nextHasNoMarginBottom
					/>

					{ filteredAdvancedOptions.length > 0 ? (
						<ul className="plugin-settings__advanced-list">
							{ filteredAdvancedOptions.map( ( option ) => (
								<li key={ option.id }>
									<strong>{ option.label }</strong>
									<p>{ option.description }</p>
								</li>
							) ) }
						</ul>
					) : (
						<EmptyState.Root>
							<EmptyState.Visual>
								<EmptyState.Icon
									icon={
										<SVG viewBox="0 0 48 48" fill="none">
											<Circle
												cx="20"
												cy="20"
												r="13"
												stroke="currentColor"
												strokeWidth="2"
											/>
											<Path
												d="M29.5 29.5 L40 40"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
											/>
											<Path
												d="M14 20 H26"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
											/>
										</SVG>
									}
								/>
							</EmptyState.Visual>
							<EmptyState.Title>No matching settings</EmptyState.Title>
							<EmptyState.Description>
								Try a different search term, or clear the search to see all
								advanced settings.
							</EmptyState.Description>
						</EmptyState.Root>
					) }
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</div>
	);
}

export default PluginSettings;
