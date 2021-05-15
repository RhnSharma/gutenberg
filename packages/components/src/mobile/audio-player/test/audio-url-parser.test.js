/**
 * Internal dependencies
 */
import { parseAudioUrl } from '../audio-url-parser';

const supportedAudioUrlsWithExtensions = [
	'https://www.mp3.com/file.mp3?key1=value1&key2=value2#anchorforsomereason',
	'https://www.mp3.com/file.mp3?key1=value1&key2=value2',
	'https://www.mp3.com/file.mp3',
];

const supportedAudioUrlsWithoutExtensions = [
	'https://www.mp3.com/file?key1=value1&key2=value2#anchorforsomereason',
	'https://www.mp3.com/file?key1=value1&key2=value2',
	'https://www.mp3.com/file',
	'https://www.mp3.com/folder/file',
];

describe( 'supportedAudioUrlsWithExtensions', () => {
	supportedAudioUrlsWithExtensions.forEach( ( url ) => {
		it( `supports ${ url }`, () => {
			const { title, extension } = parseAudioUrl( url );
			expect( title ).not.toBe( '' );
			expect( extension ).not.toBe( '' );
		} );
	} );
} );

describe( 'supportedAudioUrlsWithoutExtensions', () => {
	supportedAudioUrlsWithoutExtensions.forEach( ( url ) => {
		it( `supports ${ url }`, () => {
			const { title, extension } = parseAudioUrl( url );
			expect( title ).not.toBe( '' );
			expect( extension ).toBe( '' );
		} );
	} );
} );
