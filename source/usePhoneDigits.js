import { useRef, useState, useCallback, useEffect } from 'react'
import { AsYouType, getCountryCallingCode, parseDigits } from 'libphonenumber-js/core'

/**
 * Returns `[phoneDigits, setPhoneDigits]`.
 * "Phone digits" includes not only "digits" but also a `+` sign.
 */
export default function usePhoneDigits({
	value,
	onChange,
	country,
	defaultCountry,
	international,
	withCountryCallingCode,
	useNationalFormatForDefaultCountryValue,
	metadata
}) {
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
	// `phoneDigits` is the `value` passed to the `<input/>`.
	const [phoneDigits, setPhoneDigits] = useState(getInitialParsedInput())
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
			setPhoneDigits(getInitialParsedInput())
		}
	}, [value])
	// If the `country` has been changed then re-initialize the component.
	useEffect(() => {
		if (country !== prevCountry) {
			setPrevCountry(country)
			setPhoneDigits(getInitialParsedInput())
		}
	}, [country])
	// If the `defaultCountry` has been changed then re-initialize the component.
	useEffect(() => {
		if (defaultCountry !== prevDefaultCountry) {
			setPrevDefaultCountry(defaultCountry)
			setPhoneDigits(getInitialParsedInput())
		}
	}, [defaultCountry])
	// Update the `value` after `valueForParsedInput` has been updated.
	useEffect(() => {
		if (valueForParsedInput !== value) {
			onChange(valueForParsedInput)
		}
	}, [valueForParsedInput])
	const onSetPhoneDigits = useCallback((phoneDigits) => {
		let value
		if (country) {
			if (international && withCountryCallingCode) {
				// The `<input/>` value must start with the country calling code.
				const countryCallingCode = '+' + getCountryCallingCode(country, metadata)
				if (phoneDigits.indexOf(countryCallingCode) !== 0) {
					// Undo the `<input/>` value change if it doesn't:
					// Force a re-render of the `<input/>` with previous `phoneDigits` value.
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
				if (phoneDigits && phoneDigits[0] === '+') {
					// Remove the `+`.
					phoneDigits = phoneDigits.slice(1)
				}
			}
		} else if (!defaultCountry) {
			// Force a `+` in the beginning of a `value`
			// when no `country` and `defaultCountry` have been specified.
			if (phoneDigits && phoneDigits[0] !== '+') {
				// Prepend a `+`.
				phoneDigits = '+' + phoneDigits
			}
		}
		// Convert `phoneDigits` to `value`.
		if (phoneDigits) {
			const asYouType = new AsYouType(country || defaultCountry, metadata)
			asYouType.input(
				country && international && !withCountryCallingCode ?
				`+${getCountryCallingCode(country, metadata)}${phoneDigits}` :
				phoneDigits
			)
			const phoneNumber = asYouType.getNumber()
			// If it's a "possible" incomplete phone number.
			if (phoneNumber) {
				value = phoneNumber.number
			}
		}
		setPhoneDigits(phoneDigits)
		setValueForParsedInput(value)
	}, [
		country,
		international,
		withCountryCallingCode,
		defaultCountry,
		metadata,
		setPhoneDigits,
		setValueForParsedInput,
		rerender,
		countryMismatchDetected
	])
	return [
		phoneDigits,
		onSetPhoneDigits
	]
}

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