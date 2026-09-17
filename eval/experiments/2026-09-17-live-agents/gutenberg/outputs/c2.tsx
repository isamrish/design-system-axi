import React, { useMemo, useState } from 'react';
import { Panel, PanelBody, TextControl, Placeholder, Notice } from '@wordpress/components';
import { Badge } from '@wordpress/ui';

/**
 * A handful of setting names used purely to give the "search returns no
 * results" empty state something real to react to.
 */
const SETTING_ENTRIES = [
	{ id: 'api-key', label: 'API key' },
	{ id: 'sync-interval', label: 'Sync interval' },
	{ id: 'debug-logging', label: 'Debug logging' },
	{ id: 'webhook-url', label: 'Webhook URL' },
];

/**
 * Very small format heuristic for the demo: a valid key looks like
 * `sk-` followed by at least 16 alphanumeric characters.
 */
function isApiKeyFormatValid( key: string ): boolean {
	return /^sk-[A-Za-z0-9]{16,}$/.test( key );
}

export function PluginSettings() {
	const [ apiKey, setApiKey ] = useState( '' );
	const [ isConnected ] = useState( true );
	const [ searchTerm, setSearchTerm ] = useState( '' );

	const visibleEntries = useMemo( () => {
		const term = searchTerm.trim().toLowerCase();
		if ( ! term ) {
			return SETTING_ENTRIES;
		}
		return SETTING_ENTRIES.filter( ( entry ) =>
			entry.label.toLowerCase().includes( term )
		);
	}, [ searchTerm ] );

	const trimmedKey = apiKey.trim();
	// null = no opinion yet (field untouched), otherwise true/false.
	const keyFormatIsValid =
		trimmedKey.length === 0 ? null : isApiKeyFormatValid( trimmedKey );

	return (
		<div className="plugin-settings">
			<h2>Plugin settings</h2>

			<TextControl
				label="Search settings"
				help="Filter the settings list below by name."
				value={ searchTerm }
				onChange={ setSearchTerm }
			/>

			{ visibleEntries.length === 0 ? (
				// 2. Message with an illustration for a search with no results.
				<Placeholder
					icon="search"
					label="No settings found"
					instructions={ `No settings match "${ searchTerm }". Try a different search term.` }
				/>
			) : (
				<ul className="plugin-settings__list">
					{ visibleEntries.map( ( entry ) => (
						<li key={ entry.id }>{ entry.label }</li>
					) ) }
				</ul>
			) }

			{ /* 1. "Advanced settings" section the user can expand/collapse. */ }
			<Panel>
				<PanelBody title="Advanced settings" initialOpen={ false }>
					<div className="plugin-settings__connection-status">
						{ /* 4. Small colored label showing the connection status. */ }
						<Badge intent={ isConnected ? 'success' : 'error' }>
							{ isConnected ? 'Connected' : 'Disconnected' }
						</Badge>
					</div>

					{ /* 3. API key field with a visible label and help text. */ }
					<TextControl
						label="API key"
						help="Find this key in your account dashboard under API access."
						value={ apiKey }
						onChange={ setApiKey }
						type="password"
					/>

					{ /* 5. Inline message under the field about key format validity. */ }
					{ keyFormatIsValid !== null && (
						<Notice
							status={ keyFormatIsValid ? 'success' : 'error' }
							isDismissible={ false }
						>
							{ keyFormatIsValid
								? 'This looks like a validly formatted API key.'
								: 'This does not look like a valid API key. Expected format: sk-XXXXXXXXXXXXXXXX.' }
						</Notice>
					) }
				</PanelBody>
			</Panel>
		</div>
	);
}
