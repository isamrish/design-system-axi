import { useState } from 'react';
import {
	PanelBody,
	TextControl,
	Notice,
	Placeholder,
	Heading,
	HStack,
	VStack,
} from '@wordpress/components';
import { Badge } from '@wordpress/ui';

type ConnectionStatus = 'connected' | 'disconnected';

// A permissive but real-looking API key shape: letters, digits, dashes and
// underscores, 20-64 characters long.
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

const NO_RESULTS_ILLUSTRATION = (
	<svg
		width="48"
		height="48"
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<circle cx="21" cy="21" r="12" stroke="currentColor" strokeWidth="2" />
		<line
			x1="30.4142"
			y1="30"
			x2="41"
			y2="40.5858"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

export function PluginSettings() {
	const [ apiKey, setApiKey ] = useState( '' );
	const [ connectionStatus ] = useState< ConnectionStatus >( 'connected' );
	const [ optionSearch, setOptionSearch ] = useState( '' );

	// Advanced settings are a fixed, small list of option labels; the search
	// field above them filters this list down as the admin types.
	const advancedOptionLabels = [ 'Cache duration', 'Debug logging', 'Webhook URL' ];
	const matchingAdvancedOptions = advancedOptionLabels.filter( ( label ) =>
		label.toLowerCase().includes( optionSearch.trim().toLowerCase() )
	);
	const hasSearchedAdvancedOptions = optionSearch.trim().length > 0;
	const hasNoAdvancedResults =
		hasSearchedAdvancedOptions && matchingAdvancedOptions.length === 0;

	const isApiKeyEmpty = apiKey.length === 0;
	const isApiKeyValid = API_KEY_PATTERN.test( apiKey );

	return (
		<VStack spacing={ 6 } className="plugin-settings">
			<Heading level={ 2 }>Plugin settings</Heading>

			<HStack justify="flex-start" spacing={ 2 }>
				<span>Connection status:</span>
				<Badge intent={ connectionStatus === 'connected' ? 'success' : 'error' }>
					{ connectionStatus === 'connected' ? 'Connected' : 'Disconnected' }
				</Badge>
			</HStack>

			<VStack spacing={ 2 }>
				<TextControl
					type="password"
					label="API key"
					help="Find your API key in your account dashboard under Settings > API access."
					value={ apiKey }
					onChange={ setApiKey }
					autoComplete="off"
				/>
				{ ! isApiKeyEmpty && (
					<Notice
						status={ isApiKeyValid ? 'success' : 'error' }
						isDismissible={ false }
						className="plugin-settings__api-key-notice"
					>
						{ isApiKeyValid
							? 'This looks like a valid API key format.'
							: 'This does not look like a valid API key format.' }
					</Notice>
				) }
			</VStack>

			<PanelBody title="Advanced settings" initialOpen={ false }>
				<TextControl
					label="Search advanced settings"
					value={ optionSearch }
					onChange={ setOptionSearch }
					placeholder="e.g. cache, logging, webhook"
				/>

				{ hasNoAdvancedResults ? (
					<Placeholder
						icon={ NO_RESULTS_ILLUSTRATION }
						label="No matching settings"
						instructions={ `No advanced settings match "${ optionSearch }". Try a different search term.` }
					/>
				) : (
					<VStack spacing={ 2 }>
						{ matchingAdvancedOptions.map( ( label ) => (
							<TextControl key={ label } label={ label } value="" onChange={ () => {} } />
						) ) }
					</VStack>
				) }
			</PanelBody>
		</VStack>
	);
}

export default PluginSettings;
