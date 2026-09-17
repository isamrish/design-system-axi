import { useMemo, useState } from 'react';
import {
	Badge,
	Notice,
	PanelBody,
	Placeholder,
	SearchControl,
	TextControl,
} from '@wordpress/components';

/**
 * A simple line-drawing "no results" illustration. Kept inline (rather than
 * pulling in an icon package) since only @wordpress/components,
 * @wordpress/ui, and @wordpress/dataviews are available as dependencies.
 */
function NoResultsIllustration() {
	return (
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
				x1="30"
				y1="30"
				x2="40"
				y2="40"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

// Every setting label surfaced on this screen. Used only to demonstrate the
// "no results" empty state when a search term matches nothing.
const SETTINGS_ITEMS = ['API key', 'Connection status', 'Advanced settings'];

// A very small format check: real keys are longer and alphanumeric (with
// optional dashes/underscores). This is intentionally permissive; the goal
// is to catch obviously malformed input, not to validate against the
// provider's exact key grammar.
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

export function PluginSettings() {
	const [searchTerm, setSearchTerm] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [isConnected] = useState(true);

	const visibleItems = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) {
			return SETTINGS_ITEMS;
		}
		return SETTINGS_ITEMS.filter((item) =>
			item.toLowerCase().includes(query)
		);
	}, [searchTerm]);

	const trimmedKey = apiKey.trim();
	const isKeyFormatValid = trimmedKey.length > 0 && API_KEY_PATTERN.test(trimmedKey);

	return (
		<div className="plugin-settings">
			<SearchControl
				label="Search settings"
				placeholder="Search settings…"
				value={searchTerm}
				onChange={setSearchTerm}
			/>

			{visibleItems.length === 0 ? (
				<Placeholder
					icon={<NoResultsIllustration />}
					label="No settings found"
					instructions={`Nothing matches "${searchTerm}". Try a different search term.`}
				/>
			) : (
				<PanelBody title="Advanced settings" initialOpen={false}>
					<TextControl
						label="API key"
						help="Find your API key in your account dashboard under Developer settings."
						value={apiKey}
						onChange={setApiKey}
						type="password"
						autoComplete="off"
					/>

					{trimmedKey.length > 0 && (
						<Notice
							status={isKeyFormatValid ? 'success' : 'error'}
							isDismissible={false}
							className="plugin-settings__api-key-validity"
						>
							{isKeyFormatValid
								? 'This looks like a validly formatted API key.'
								: 'This does not look like a validly formatted API key.'}
						</Notice>
					)}

					<Badge intent={isConnected ? 'success' : 'error'}>
						{isConnected ? 'Connected' : 'Disconnected'}
					</Badge>
				</PanelBody>
			)}
		</div>
	);
}

export default PluginSettings;
