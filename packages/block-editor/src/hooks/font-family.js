/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import TokenList from '@wordpress/token-list';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import FontFamilyControl from '../components/font-family';

export const FONT_FAMILY_SUPPORT_KEY = '__experimentalFontFamily';

/**
 * Filters registered block settings, extending attributes to include
 * the `fontFamily` attribute.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, FONT_FAMILY_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify a default value if needed.
	if ( ! settings.attributes.fontFamily ) {
		Object.assign( settings.attributes, {
			fontFamily: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject font family.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, FONT_FAMILY_SUPPORT_KEY ) ) {
		return props;
	}

	if (
		hasBlockSupport(
			blockType,
			'__experimentalSkipTypographySerialization'
		)
	) {
		return props;
	}

	if ( ! attributes?.fontFamily ) {
		return props;
	}

	// Use TokenList to dedupe classes.
	const classes = new TokenList( props.className );
	classes.add( `has-${ attributes?.fontFamily }-font-family` );
	const newClassName = classes.value;
	props.className = newClassName ? newClassName : undefined;

	return props;
}

export function FontFamilyEdit( {
	name,
	setAttributes,
	attributes: { fontFamily },
} ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );
	const isDisable = useIsFontFamilyDisabled( { name } );

	if ( isDisable ) {
		return null;
	}

	const value = find( fontFamilies, ( { slug } ) => fontFamily === slug )
		?.fontFamily;

	function onChange( newValue ) {
		const predefinedFontFamily = find(
			fontFamilies,
			( { fontFamily: f } ) => f === newValue
		);
		setAttributes( {
			fontFamily: predefinedFontFamily?.slug,
		} );
	}

	return (
		<FontFamilyControl
			className="block-editor-hooks-font-family-control"
			fontFamilies={ fontFamilies }
			value={ value }
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if font-family functionality is disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
export function useIsFontFamilyDisabled( { name } ) {
	const fontFamilies = useSetting( 'typography.fontFamilies' );
	return (
		! fontFamilies ||
		fontFamilies.length === 0 ||
		! hasBlockSupport( name, FONT_FAMILY_SUPPORT_KEY )
	);
}

/**
 * Add inline styles for font families.
 * Ideally, this is not needed and themes load the font-family classes on the
 * editor.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
const withFontFamilyInlineStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const fontFamilies = useSetting( 'typography.fontFamilies' );
		const {
			name: blockName,
			attributes: { fontFamily, style },
			wrapperProps,
		} = props;

		// Only add inline styles if the block supports font families,
		// doesn't skip serialization of font families,
		// doesn't already have an inline font family,
		// and does have a class to extract the font family from.
		if (
			! hasBlockSupport( blockName, FONT_FAMILY_SUPPORT_KEY ) ||
			hasBlockSupport(
				blockName,
				'__experimentalSkipTypographySerialization'
			) ||
			! fontFamily ||
			style?.typography?.fontFamily
		) {
			return <BlockListBlock { ...props } />;
		}

		const fontFamilyValue = find(
			fontFamilies,
			( { slug } ) => slug === fontFamily
		)?.fontFamily;

		const newProps = {
			...props,
			wrapperProps: {
				...wrapperProps,
				style: {
					fontFamily: fontFamilyValue,
					...wrapperProps?.style,
				},
			},
		};

		return <BlockListBlock { ...newProps } />;
	},
	'withFontFamilyInlineStyles'
);

addFilter(
	'blocks.registerBlockType',
	'core/font/addAttribute',
	addAttributes
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/fontFamily/addSaveProps',
	addSaveProps
);

addFilter(
	'editor.BlockListBlock',
	'core/font-family/with-font-family-inline-styles',
	withFontFamilyInlineStyles
);
