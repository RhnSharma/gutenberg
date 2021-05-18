/**
 * WordPress dependencies
 */
import { useRef, useCallback, useLayoutEffect } from '@wordpress/element';

/* eslint-disable jsdoc/valid-types */
/**
 * @template T
 * @typedef {T extends import('react').Ref<infer R> ? R : never} TypeFromRef
 */
/* eslint-enable jsdoc/valid-types */

/**
 * @template T
 * @param {import('react').Ref<T>} ref
 * @param {T} value
 */
function assignRef( ref, value ) {
	if ( typeof ref === 'function' ) {
		ref( value );
	} else if ( ref && ref.hasOwnProperty( 'current' ) ) {
		/* eslint-disable jsdoc/no-undefined-types */
		/** @type {import('react').MutableRefObject<T>} */ ( ref ).current = value;
		/* eslint-enable jsdoc/no-undefined-types */
	}
}

/**
 * Merges refs into one ref callback. Ensures the merged ref callbacks are only
 * called when it changes (as a result of a `useCallback` dependency update) or
 * when the ref value changes. If you don't wish a ref callback to be called on
 * every render, wrap it with `useCallback( ref, [] )`.
 * Dependencies can be added, but when a dependency changes, the old ref
 * callback will be called with `null` and the new ref callback will be called
 * with the same node.
 *
 * @template {import('react').Ref<any>} T
 * @param {Array<T>} refs The refs to be merged.
 *
 * @return {import('react').Ref<TypeFromRef<T>>} The merged ref callback.
 */
export default function useMergeRefs( refs ) {
	const element = useRef();
	const didElementChange = useRef( false );
	/* eslint-disable jsdoc/no-undefined-types */
	/** @type {import('react').MutableRefObject<T[]>} */
	/* eslint-enable jsdoc/no-undefined-types */
	const previousRefs = useRef( [] );
	const currentRefs = useRef( refs );

	// Update on render before the ref callback is called, so the ref callback
	// always has access to the current refs.
	currentRefs.current = refs;

	// If any of the refs change, call the previous ref with `null` and the new
	// ref with the node, except when the element changes in the same cycle, in
	// which case the ref callbacks will already have been called.
	useLayoutEffect( () => {
		if ( didElementChange.current === false ) {
			refs.forEach( ( ref, index ) => {
				const previousRef = previousRefs.current[ index ];
				if ( ref !== previousRef ) {
					assignRef( previousRef, null );
					assignRef( ref, element.current );
				}
			} );
		}

		previousRefs.current = refs;
	}, refs );

	// No dependencies, must be reset after every render so ref callbacks are
	// correctly called after a ref change.
	useLayoutEffect( () => {
		didElementChange.current = false;
	} );

	// There should be no dependencies so that `callback` is only called when
	// the node changes.
	return useCallback( ( value ) => {
		// Update the element so it can be used when calling ref callbacks on a
		// dependency change.
		assignRef( element, value );

		didElementChange.current = true;

		// When an element changes, the current ref callback should be called
		// with the new element and the previous one with `null`.
		const refsToAssign = value ? currentRefs.current : previousRefs.current;

		// Update the latest refs.
		for ( const ref of refsToAssign ) {
			assignRef( ref, value );
		}
	}, [] );
}
