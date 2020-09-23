import React, { useRef, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { AsYouType, getCountryCallingCode, parseDigits } from 'libphonenumber-js/core'

import InputSmart from './InputSmart'
import InputBasic from './InputBasic'

export function createInput(defaultMetadata) {
	function PhoneInput({
		country,
		defaultCountry,
		useNationalFormatForDefaultCountryValue,
		value,
		onChange,
		metadata,
		smartCaret,
		international,
		withCountryCallingCode,
		...rest
	}, ref) {
		const countryMismatchDetected = useRef()
		const onCountryMismatch = (value, country, actualCountry) => {
			console.error(`[react-phone-number-input] Expected phone number ${value} to correspond to country ${country} but ${actualCountry ? 'in reality it corresponds to country ' + actualCountry : 'it doesn\'t'}.`)
			countryMismatchDetected.current = true
		}
		const getInitialParsedInput = () => getParsedInputForValue(
			value,
			country,
			international,
			withCountryCallingCode,
			defaultCountry,
			useNationalFormatForDefaultCountryValue,
			metadata,
			onCountryMismatch
		)
		// This is only used to detect `country` property change.
		const [prevCountry, setPrevCountry] = useState(country)
		// This is only used to detect `defaultCountry` property change.
		const [prevDefaultCountry, setPrevDefaultCountry] = useState(defaultCountry)
		// `parsedInput` is the `value` passed to the `<input/>`.
		const [parsedInput, setParsedInput] = useState(getInitialParsedInput())
		// This is only used to detect `value` property changes.
		const [valueForParsedInput, setValueForParsedInput] = useState(value)
		// Rerender hack.
		const [rerenderTrigger, setRerenderTrigger] = useState()
		const rerender = useCallback(() => setRerenderTrigger({}), [setRerenderTrigger])
		// If `value` property has been changed externally
		// then re-initialize the component.
		useEffect(() => {
			if (value !== valueForParsedInput) {
				setValueForParsedInput(value)
				setParsedInput(getInitialParsedInput())
			}
		}, [value])
		// If the `country` has been changed then re-initialize the component.
		useEffect(() => {
			if (country !== prevCountry) {
				setPrevCountry(country)
				setParsedInput(getInitialParsedInput())
			}
		}, [country])
		// If the `defaultCountry` has been changed then re-initialize the component.
		useEffect(() => {
			if (defaultCountry !== prevDefaultCountry) {
				setPrevDefaultCountry(defaultCountry)
				setParsedInput(getInitialParsedInput())
			}
		}, [defaultCountry])
		// Update the `value` after `valueForParsedInput` has been updated.
		useEffect(() => {
			if (valueForParsedInput !== value) {
				onChange(valueForParsedInput)
			}
		}, [valueForParsedInput])
		const onParsedInputChange = useCallback((parsedInput) => {
			let value
			if (country) {
				if (international && withCountryCallingCode) {
					// The `<input/>` value must start with the country calling code.
					const countryCallingCode = '+' + getCountryCallingCode(country, metadata)
					if (parsedInput.indexOf(countryCallingCode) !== 0) {
						// Undo the `<input/>` value change if it doesn't:
						// Force a re-render of the `<input/>` with previous `parsedInput` value.
						if (countryMismatchDetected.current) {
							// In case of a `country`/`value` mismatch,
							// if it performed an "undo" here, then
							// it wouldn't let a user edit their phone number at all,
							// so this special case at least allows phone number editing
							// when `value` already doesn't match the `country`.
						} else {
							return rerender()
						}
					}
				} else {
					// Entering phone number either in "national" format
					// when `country` has been specified, or in "international" format
					// when `country` has been specified but `withCountryCallingCode` hasn't.
					// Therefore, `+` is not allowed.
					if (parsedInput && parsedInput[0] === '+') {
						// Remove the `+`.
						parsedInput = parsedInput.slice(1)
					}
				}
			} else if (!defaultCountry) {
				// Force a `+` in the beginning of a `value`
				// when no `country` and `defaultCountry` have been specified.
				if (parsedInput && parsedInput[0] !== '+') {
					// Prepend a `+`.
					parsedInput = '+' + parsedInput
				}
			}
			// Convert `parsedInput` to `value`.
			if (parsedInput) {
				const asYouType = new AsYouType(country || defaultCountry, metadata)
				asYouType.input(
					country && international && !withCountryCallingCode ?
					`+${getCountryCallingCode(country, metadata)}${parsedInput}` :
					parsedInput
				)
				const phoneNumber = asYouType.getNumber()
				// If it's a "possible" incomplete phone number.
				if (phoneNumber) {
					value = phoneNumber.number
				}
			}
			setParsedInput(parsedInput)
			setValueForParsedInput(value)
		}, [
			country,
			international,
			withCountryCallingCode,
			defaultCountry,
			metadata,
			setParsedInput,
			setValueForParsedInput,
			rerender,
			countryMismatchDetected
		])
		const InputComponent = smartCaret ? InputSmart : InputBasic
		return (
			<InputComponent
				{...rest}
				ref={ref}
				metadata={metadata}
				international={international}
				withCountryCallingCode={withCountryCallingCode}
				country={country || defaultCountry}
				value={parsedInput}
				onChange={onParsedInputChange} />
		)
	}

	PhoneInput = React.forwardRef(PhoneInput)

	PhoneInput.propTypes = {
		/**
		 * HTML `<input/>` `type` attribute.
		 */
		type: PropTypes.string,

		/**
		 * HTML `<input/>` `autocomplete` attribute.
		 */
		autoComplete: PropTypes.string,

		/**
		 * The phone number (in E.164 format).
		 * Examples: `undefined`, `"+12"`, `"+12133734253"`.
		 */
		value: PropTypes.string,

		/**
		 * Updates the `value`.
		 */
		onChange: PropTypes.func.isRequired,

		/**
		 * A two-letter country code for formatting `value`
		 * as a national phone number (example: `(213) 373-4253`),
		 * or as an international phone number without "country calling code"
		 * if `international` property is passed (example: `213 373 4253`).
		 * Example: "US".
		 * If no `country` is passed then `value`
		 * is formatted as an international phone number.
		 * (example: `+1 213 373 4253`)
		 */
		country: PropTypes.string,

		/**
		 * A two-letter country code for formatting `value`
		 * when a user inputs a national phone number (example: `(213) 373-4253`).
		 * The user can still input a phone number in international format.
		 * Example: "US".
		 * `country` and `defaultCountry` properties are mutually exclusive.
		 */
		defaultCountry: PropTypes.string,

		/**
		 * If `country` property is passed along with `international={true}` property
		 * then the phone number will be input in "international" format for that `country`
		 * (without "country calling code").
		 * For example, if `country="US"` property is passed to "without country select" input
		 * then the phone number will be input in the "national" format for `US` (`(213) 373-4253`).
		 * But if both `country="US"` and `international={true}` properties are passed then
		 * the phone number will be input in the "international" format for `US` (`213 373 4253`)
		 * (without "country calling code" `+1`).
		 */
		international: PropTypes.bool,

		/**
		 * If `country` and `international` properties are set,
		 * then by default it won't include "country calling code" in the input field.
		 * To change that, pass `withCountryCallingCode` property,
		 * and it will include "country calling code" in the input field.
		 */
		withCountryCallingCode: PropTypes.bool,

		/**
		 * The `<input/>` component.
		 */
		inputComponent: PropTypes.elementType,

		/**
		 * By default, the caret position is being "intelligently" managed
		 * while a user inputs a phone number.
		 * This "smart" caret behavior can be turned off
		 * by passing `smartCaret={false}` property.
		 * This is just an "escape hatch" for any possible caret position issues.
		 */
		// Is `true` by default.
		smartCaret: PropTypes.bool.isRequired,

		/**
		 * When `defaultCountry` is defined and the initial `value` corresponds to `defaultCountry`,
		 * then the `value` will be formatted as a national phone number by default.
		 * To format the initial `value` of `defaultCountry` as an international number instead
		 * set `useNationalFormatForDefaultCountryValue` property to `true`.
		 */
		useNationalFormatForDefaultCountryValue: PropTypes.bool.isRequired,

		/**
		 * `libphonenumber-js` metadata.
		 */
		metadata: PropTypes.object.isRequired
	}

	PhoneInput.defaultProps = {
		/**
		 * HTML `<input/>` `type="tel"`.
		 */
		type: 'tel',

		/**
		 * Remember (and autofill) the value as a phone number.
		 */
		autoComplete: 'tel',

		/**
		 * Set to `false` to use "basic" caret instead of the "smart" one.
		 */
		smartCaret: true,

		/**
		 * Set to `true` to force international phone number format
		 * (without "country calling code") when `country` is specified.
		 */
		// international: false,

		/**
		 * Prefer national format when formatting E.164 phone number `value`
		 * corresponding to `defaultCountry`.
		 */
		useNationalFormatForDefaultCountryValue: true,

		/**
		 * `libphonenumber-js` metadata.
		 */
		metadata: defaultMetadata
	}

	return PhoneInput
}

export default createInput()

/**
 * Returns phone number input field value for a E.164 phone number `value`.
 * @param  {string} [value]
 * @param  {string} [country]
 * @param  {boolean} [international]
 * @param  {boolean} [withCountryCallingCode]
 * @param  {string} [defaultCountry]
 * @param  {boolean} [useNationalFormatForDefaultCountryValue]
 * @param  {object} metadata
 * @return {string}
 */
function getParsedInputForValue(
	value,
	country,
	international,
	withCountryCallingCode,
	defaultCountry,
	useNationalFormatForDefaultCountryValue,
	metadata,
	onCountryMismatch
) {
	if (country && international && withCountryCallingCode) {
		const prefix = '+' + getCountryCallingCode(country, metadata)
		if (value) {
			if (value.indexOf(prefix) !== 0) {
				onCountryMismatch(value, country)
			}
			return value
		}
		return prefix
	}
	if (!value) {
		return ''
	}
	if (!country && !defaultCountry) {
		return value
	}
	const asYouType = new AsYouType(undefined, metadata)
	asYouType.input(value)
	const phoneNumber = asYouType.getNumber()
	if (phoneNumber) {
		if (country) {
			if (phoneNumber.country && phoneNumber.country !== country) {
				onCountryMismatch(value, country, phoneNumber.country)
			} else if (phoneNumber.countryCallingCode !== getCountryCallingCode(country, metadata)) {
				onCountryMismatch(value, country)
			}
			if (international) {
				return phoneNumber.nationalNumber
			}
			return parseDigits(phoneNumber.formatNational())
		} else {
			if (phoneNumber.country && phoneNumber.country === defaultCountry && useNationalFormatForDefaultCountryValue) {
				return parseDigits(phoneNumber.formatNational())
			}
			return value
		}
	} else {
		return ''
	}
}