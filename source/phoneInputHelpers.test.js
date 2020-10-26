import {
	getPreSelectedCountry,
	getCountrySelectOptions,
	parsePhoneNumber,
	generateNationalNumberDigits,
	migrateParsedInputForNewCountry,
	e164,
	getCountryForPartialE164Number,
	parseInput,
	getInitialParsedInput,
	// Private functions
	getCountryFromPossiblyIncompleteInternationalPhoneNumber,
	compareStrings,
	stripCountryCallingCode,
	getNationalSignificantNumberDigits,
	getInternationalPhoneNumberPrefix,
	couldNumberBelongToCountry,
	trimNumber
} from './phoneInputHelpers'

import metadata from 'libphonenumber-js/metadata.min.json'

describe('phoneInputHelpers', () => {
	it('should get pre-selected country', () => {
		// Can't return "International". Return the first country available.
		getPreSelectedCountry({
			phoneNumber: {},
			countries: ['US', 'RU'],
			required: true,
			metadata
		}).should.equal('US')

		// Can return "International".
		// Country can't be derived from the phone number.
		expect(getPreSelectedCountry({
			phoneNumber: {},
			countries: ['US', 'RU'],
			required: false,
			metadata
		})).to.be.undefined

		// Derive country from the phone number.
		getPreSelectedCountry({
			phoneNumber: { country: 'RU', phone: '8005553535' },
			countries: ['US', 'RU'],
			required: true,
			metadata
		}).should.equal('RU')

		// Country derived from the phone number overrides the supplied one.
		getPreSelectedCountry({
			phoneNumber: { country: 'RU', phone: '8005553535' },
			defaultCountry: 'US',
			countries: ['US', 'RU'],
			required: true,
			metadata
		}).should.equal('RU')

		// Only pre-select a country if it's in the available `countries` list.
		getPreSelectedCountry({
			phoneNumber: { country: 'RU', phone: '8005553535' },
			countries: ['US', 'DE'],
			required: true,
			metadata
		}).should.equal('US')

		expect(getPreSelectedCountry({
			phoneNumber: { country: 'RU', phone: '8005553535' },
			defaultCountry: 'US',
			countries: ['US', 'DE'],
			required: false,
			metadata
		})).to.be.undefined
	})

	it('should generate country select options', () => {
		const defaultLabels = {
			'RU': 'Russia (Россия)',
			'US': 'United States',
			'ZZ': 'International'
		}

		// Without custom country names.
		getCountrySelectOptions({
			countries: ['US', 'RU'],
			countryNames: defaultLabels
		}).should.deep.equal([{
			value: 'RU',
			label: 'Russia (Россия)'
		}, {
			value: 'US',
			label: 'United States'
		}])

		// With custom country names.
		getCountrySelectOptions({
			countries: ['US', 'RU'],
			countryNames: { ...defaultLabels, 'RU': 'Russia' }
		}).should.deep.equal([{
			value: 'RU',
			label: 'Russia'
		}, {
			value: 'US',
			label: 'United States'
		}])

		// Should substitute missing country names with country codes.
		getCountrySelectOptions({
			countries: ['US', 'RU'],
			countryNames: { ...defaultLabels, 'RU': undefined }
		}).should.deep.equal([{
			value: 'RU',
			label: 'RU'
		}, {
			value: 'US',
			label: 'United States'
		}])

		// With "International" (without custom country names).
		getCountrySelectOptions({
			countries: ['US', 'RU'],
			countryNames: defaultLabels,
			includeInternationalOption: true
		}).should.deep.equal([{
			label: 'International'
		}, {
			value: 'RU',
			label: 'Russia (Россия)'
		}, {
			value: 'US',
			label: 'United States'
		}])

		// With "International" (with custom country names).
		getCountrySelectOptions({
			countries: ['US', 'RU'],
			countryNames: { ...defaultLabels, 'RU': 'Russia', ZZ: 'Intl' },
			includeInternationalOption: true
		}).should.deep.equal([{
			label: 'Intl'
		}, {
			value: 'RU',
			label: 'Russia'
		}, {
			value: 'US',
			label: 'United States'
		}])
	})

	it('should generate country select options (custom `compareStrings`)', () => {
		const defaultLabels = {
			'RU': 'Russia (Россия)',
			'US': 'United States',
			'ZZ': 'International'
		}

		// Without custom country names.
		getCountrySelectOptions({
			countries: ['US', 'RU'],
			countryNames: defaultLabels,
			// Reverse order.
			compareStrings: (a, b) => a < b ? 1 : (a > b ? -1 : 0)
		}).should.deep.equal([{
			value: 'US',
			label: 'United States'
		}, {
			value: 'RU',
			label: 'Russia (Россия)'
		}])
	})

	// it('should generate country select options (Chinese locale)', () => {
	// 	// https://gitlab.com/catamphetamine/react-phone-number-input/-/issues/20
	//
	// 	const defaultLabels = {
	// 		'RU': 'Russia (Россия)',
	// 		'US': 'United States',
	// 		'ZZ': 'International'
	// 	}
	//
	// 	// Without custom country names.
	// 	getCountrySelectOptions({
	// 		countries: ['US', 'RU'],
	// 		countryNames: defaultLabels,
	// 		compareStringsLocales: 'zh-CN-u-co-pinyin'
	// 	}).should.deep.equal([{
	// 		value: 'US',
	// 		label: 'United States'
	// 	}, {
	// 		value: 'RU',
	// 		label: 'Russia (Россия)'
	// 	}])
	// })

	it('should parse phone numbers', () => {
		const phoneNumber = parsePhoneNumber('+78005553535', metadata)
		phoneNumber.country.should.equal('RU')
		phoneNumber.nationalNumber.should.equal('8005553535')

		// No `value` passed.
		expect(parsePhoneNumber(null, metadata)).to.equal.undefined
	})

	it('should generate national number digits', () => {
		const phoneNumber = parsePhoneNumber('+33509758351', metadata)
		generateNationalNumberDigits(phoneNumber).should.equal('0509758351')
	})

	it('should migrate parsed input for new country', () => {
		// No input. Returns `undefined`.
		migrateParsedInputForNewCountry('', {
			prevCountry: 'RU',
			newCountry: 'US',
			metadata,
			useNationalFormat: true
		}).should.equal('')

		// Switching from "International" to a country
		// to which the phone number already belongs to.
		// No changes. Returns `undefined`.
		migrateParsedInputForNewCountry('+18005553535', {
			newCountry: 'US',
			metadata
		}).should.equal('+18005553535')

		// Switching between countries. National number. No changes.
		migrateParsedInputForNewCountry('8005553535', {
			prevCountry: 'RU',
			newCountry: 'US',
			metadata
		}).should.equal('8005553535')

		// Switching from "International" to a country. Calling code not matches. Resets parsed input.
		migrateParsedInputForNewCountry('+78005553535', {
			newCountry: 'US',
			metadata
		}).should.equal('+1')

		// Switching from "International" to a country. Calling code matches. Doesn't reset parsed input.
		migrateParsedInputForNewCountry('+12223333333', {
			newCountry: 'US',
			metadata
		}).should.equal('+12223333333')

		// Switching countries. International number. Calling code doesn't match.
		migrateParsedInputForNewCountry('+78005553535', {
			prevCountry: 'RU',
			newCountry: 'US',
			metadata
		}).should.equal('+1')

		// Switching countries. International number. Calling code matches.
		migrateParsedInputForNewCountry('+18005553535', {
			prevCountry: 'CA',
			newCountry: 'US',
			metadata
		}).should.equal('+18005553535')

		// Switching countries. International number.
		// Country calling code is longer than the amount of digits available.
		migrateParsedInputForNewCountry('+99', {
			prevCountry: 'KG',
			newCountry: 'US',
			metadata
		}).should.equal('+1')

		// Switching countries. International number. No such country code.
		migrateParsedInputForNewCountry('+99', {
			prevCountry: 'KG',
			newCountry: 'US',
			metadata
		}).should.equal('+1')

		// Switching to "International". National number.
		migrateParsedInputForNewCountry('8800555', {
			prevCountry: 'RU',
			metadata
		}).should.equal('+7800555')

		// Switching to "International". No national (significant) number digits entered.
		migrateParsedInputForNewCountry('8', {
			prevCountry: 'RU',
			metadata
		}).should.equal('')

		// Switching to "International". International number. No changes.
		migrateParsedInputForNewCountry('+78005553535', {
			prevCountry: 'RU',
			metadata
		}).should.equal('+78005553535')

		// Prefer national format. Country matches. Leaves the "national (significant) number".
		migrateParsedInputForNewCountry('+78005553535', {
			newCountry: 'RU',
			metadata,
			useNationalFormat: true
		}).should.equal('8005553535')

		// Prefer national format. Country doesn't match, but country calling code does. Leaves the "national (significant) number".
		migrateParsedInputForNewCountry('+12133734253', {
			newCountry: 'CA',
			metadata,
			useNationalFormat: true
		}).should.equal('2133734253')

		// Prefer national format. Country doesn't match, neither does country calling code. Clears the value.
		migrateParsedInputForNewCountry('+78005553535', {
			newCountry: 'US',
			metadata,
			useNationalFormat: true
		}).should.equal('')

		// Force international format. `parsedInput` is empty. From no country to a country.
		migrateParsedInputForNewCountry(null, {
			newCountry: 'US',
			metadata,
			useNationalFormat: false
		}).should.equal('+1')

		// Force international format. `parsedInput` is not empty. From a country to a country with the same calling code.
		migrateParsedInputForNewCountry('+1222', {
			prevCountry: 'CA',
			newCountry: 'US',
			metadata
		}).should.equal('+1222')

		// Force international format. `parsedInput` is not empty. From a country to a country with another calling code.
		migrateParsedInputForNewCountry('+1222', {
			prevCountry: 'CA',
			newCountry: 'RU',
			metadata
		}).should.equal('+7')

		// Force international format. `parsedInput` is not empty. From no country to a country.
		migrateParsedInputForNewCountry('+1222', {
			newCountry: 'US',
			metadata
		}).should.equal('+1222')
	})

	it('should format phone number in e164', () =>
	{
		// No number.
		expect(e164()).to.be.undefined

		// International number. Just a '+' sign.
		expect(e164('+')).to.be.undefined

		// International number.
		e164('+7800').should.equal('+7800')

		// National number. Without country.
		expect(e164('8800', null)).to.be.undefined

		// National number. With country. Just national prefix.
		expect(e164('8', 'RU', metadata)).to.be.undefined

		// National number. With country.
		e164('8800', 'RU', metadata).should.equal('+7800')
	})

	it('should trim the phone number if it exceeds the maximum length', () =>
	{
		// // No number.
		// expect(trimNumber()).to.be.undefined

		// Empty number.
		expect(trimNumber('', 'RU', metadata)).to.equal('')

		// // International number. Without country.
		// trimNumber('+780055535351').should.equal('+780055535351')

		// // National number. Without country.
		// trimNumber('880055535351', null).should.equal('880055535351')

		// National number. Doesn't exceed the maximum length.
		trimNumber('88005553535', 'RU', metadata).should.equal('88005553535')
		// National number. Exceeds the maximum length.
		trimNumber('880055535351', 'RU', metadata).should.equal('88005553535')

		// International number. Doesn't exceed the maximum length.
		trimNumber('+78005553535', 'RU', metadata).should.equal('+78005553535')
		// International number. Exceeds the maximum length.
		trimNumber('+780055535351', 'RU', metadata).should.equal('+78005553535')
	})

	it('should get country for partial E.164 number', () =>
	{
		// Just a '+' sign.
		getCountryForPartialE164Number('+', {
			country: 'RU',
			countries: ['US', 'RU'],
			metadata
		}).should.equal('RU')

		expect(getCountryForPartialE164Number('+', {
			countries: ['US', 'RU'],
			metadata
		})).to.be.undefined

		// A country can be derived.
		getCountryForPartialE164Number('+78005553535', {
			countries: ['US', 'RU'],
			metadata
		}).should.equal('RU')

		// A country can't be derived yet.
		// And the currently selected country doesn't fit the number.
		expect(getCountryForPartialE164Number('+7', {
			country: 'FR',
			countries: ['FR', 'RU'],
			metadata
		})).to.be.undefined

		expect(getCountryForPartialE164Number('+12', {
			country: 'FR',
			countries: ['FR', 'US'],
			metadata
		})).to.be.undefined

		// A country can't be derived yet.
		// And the currently selected country doesn't fit the number.
		// Bit "International" option is not available.
		getCountryForPartialE164Number('+7', {
			country: 'FR',
			countries: ['FR', 'RU'],
			required: true,
			metadata
		}).should.equal('FR')

		getCountryForPartialE164Number('+12', {
			country: 'FR',
			countries: ['FR', 'US'],
			required: true,
			metadata
		}).should.equal('FR')
	})

	it('should get country from possibly incomplete international phone number', () =>
	{
		// // `001` country calling code.
		// // Non-geographic numbering plan.
		// expect(getCountryFromPossiblyIncompleteInternationalPhoneNumber('+800', metadata)).to.be.undefined

		// Country can be derived.
		getCountryFromPossiblyIncompleteInternationalPhoneNumber('+33', metadata).should.equal('FR')

		// Country can't be derived yet.
		expect(getCountryFromPossiblyIncompleteInternationalPhoneNumber('+12', metadata)).to.be.undefined
	})

	it('should compare strings', () =>
	{
		compareStrings('aa', 'ab').should.equal(-1)
		compareStrings('aa', 'aa').should.equal(0)
		compareStrings('aac', 'aab').should.equal(1)
	})

	it('should strip country calling code from a number', () =>
	{
		// Number is longer than country calling code prefix.
		stripCountryCallingCode('+7800', 'RU', metadata).should.equal('800')

		// Number is shorter than (or equal to) country calling code prefix.
		stripCountryCallingCode('+3', 'FR', metadata).should.equal('')
		stripCountryCallingCode('+7', 'FR', metadata).should.equal('')

		// `country` doesn't fit the actual `number`.
		// Iterates through all available country calling codes.
		stripCountryCallingCode('+7800', 'FR', metadata).should.equal('800')

		// No `country`.
		// And the calling code doesn't belong to any country.
		stripCountryCallingCode('+999', null, metadata).should.equal('')
	})

	it('should get national significant number part', () =>
	{
		// International number.
		getNationalSignificantNumberDigits('+7800555', null, metadata).should.equal('800555')

		// International number.
		// No national (significant) number digits.
		expect(getNationalSignificantNumberDigits('+', null, metadata)).to.be.undefined
		expect(getNationalSignificantNumberDigits('+7', null, metadata)).to.be.undefined

		// National number.
		getNationalSignificantNumberDigits('8800555', 'RU', metadata).should.equal('800555')

		// National number.
		// No national (significant) number digits.
		expect(getNationalSignificantNumberDigits('8', 'RU', metadata)).to.be.undefined
		expect(getNationalSignificantNumberDigits('', 'RU', metadata)).to.be.undefined
	})

	it('should prepend leading digits when generating international phone number prefix', () =>
	{
		// No fixed leading digits.
		getInternationalPhoneNumberPrefix('RU', metadata).should.equal('+7')

		// Fixed leading digits.
		getInternationalPhoneNumberPrefix('AS', metadata).should.equal('+1684')
	})

	getInternationalPhoneNumberPrefix

	it('should determine of a number could belong to a country', () =>
	{
		// Matching.
		couldNumberBelongToCountry('+7800', 'RU', metadata).should.equal(true)

		// First digit already not matching.
		couldNumberBelongToCountry('+7800', 'FR', metadata).should.equal(false)

		// First digit matching, second - not matching.
		couldNumberBelongToCountry('+33', 'AM', metadata).should.equal(false)

		// Number is shorter than country calling code.
		couldNumberBelongToCountry('+99', 'KG', metadata).should.equal(true)
	})

	it('should parse input', () => {
		parseInput(undefined, {
			country: 'RU',
			metadata
		}).should.deep.equal({
			input: undefined,
			country: 'RU',
			value: undefined
		})

		parseInput('', {
			metadata
		}).should.deep.equal({
			input: '',
			country: undefined,
			value: undefined
		})

		parseInput('+', {
			metadata
		}).should.deep.equal({
			input: '+',
			country: undefined,
			value: undefined
		})

		parseInput('1213', {
			metadata
		}).should.deep.equal({
			input: '+1213',
			country: undefined,
			value: '+1213'
		})

		parseInput('+1213', {
			metadata
		}).should.deep.equal({
			input: '+1213',
			country: undefined,
			value: '+1213'
		})

		parseInput('213', {
			country: 'US',
			metadata
		}).should.deep.equal({
			input: '213',
			country: 'US',
			value: '+1213'
		})

		parseInput('+78005553535', {
			country: 'US',
			metadata
		}).should.deep.equal({
			input: '+78005553535',
			country: 'RU',
			value: '+78005553535'
		})

		// Won't reset an already selected country.

		parseInput('+15555555555', {
			country: 'US',
			metadata
		}).should.deep.equal({
			input: '+15555555555',
			country: 'US',
			value: '+15555555555'
		})

		// Should reset the country if it has likely been automatically
		// selected based on international phone number input
		// and the user decides to erase all input.
		parseInput('', {
			prevParsedInput: '+78005553535',
			country: 'RU',
			metadata
		}).should.deep.equal({
			input: '',
			country: undefined,
			value: undefined
		})

		// Should reset the country if it has likely been automatically
		// selected based on international phone number input
		// and the user decides to erase all input.
		// Should reset to default country.
		parseInput('', {
			prevParsedInput: '+78005553535',
			country: 'RU',
			defaultCountry: 'US',
			metadata
		}).should.deep.equal({
			input: '',
			country: 'US',
			value: undefined
		})

		// Should reset the country if it has likely been automatically
		// selected based on international phone number input
		// and the user decides to erase all input up to the `+` sign.
		parseInput('+', {
			prevParsedInput: '+78005553535',
			country: 'RU',
			metadata
		}).should.deep.equal({
			input: '+',
			country: undefined,
			value: undefined
		})
	})

	it('should parse input (limitMaxLength: true)', () => {
		parseInput('21337342530',{
			country: 'US',
			limitMaxLength: true,
			metadata
		}).should.deep.equal({
			input: '2133734253',
			country: 'US',
			value: '+12133734253'
		})

		parseInput('+121337342530', {
			country: 'US',
			limitMaxLength: true,
			metadata
		}).should.deep.equal({
			input: '+12133734253',
			country: 'US',
			value: '+12133734253'
		})

		// This case is intentionally ignored to simplify the code.
		parseInput('+121337342530', {
			limitMaxLength: true,
			metadata
		}).should.deep.equal({
			// input: '+12133734253',
			// country: 'US',
			// value: '+12133734253'
			input: '+121337342530',
			country: undefined,
			value: '+121337342530'
		})
	})

	it('should parse input (`international: true`)', () => {
		// Shouldn't set `country` to `defaultCountry`
		// when erasing parsed input starting with a `+`
		// when `international` is `true`.
		parseInput('', {
			prevParsedInput: '+78005553535',
			country: 'RU',
			defaultCountry: 'US',
			international: true,
			metadata
		}).should.deep.equal({
			input: '',
			country: undefined,
			value: undefined
		})

		// Should support forcing international phone number input format.
		parseInput('2', {
			prevParsedInput: '+78005553535',
			country: 'RU',
			international: true,
			metadata
		}).should.deep.equal({
			input: '+2',
			country: undefined,
			value: '+2'
		})
	})

	it('should parse input (`international: false`)', () => {
		const parse = (input, prevParsedInput, country) => parseInput(input, {
			prevParsedInput,
			country,
			international: false,
			metadata
		})

		// `input` in international format.
		// Just country calling code.
		parse('+7', '', 'RU').should.deep.equal({
			input: '',
			country: 'RU',
			value: undefined
		})

		// `input` in international format.
		// Country calling code and first digit.
		parse('+78', '', 'RU').should.deep.equal({
			input: '8',
			country: 'RU',
			value: undefined
		})

		// `input` in international format.
		// Country calling code and first two digits.
		parse('+788', '', 'RU').should.deep.equal({
			input: '88',
			country: 'RU',
			value: '+788'
		})

		// `input` in international format.
		parse('+78005553535', '', 'RU').should.deep.equal({
			input: '88005553535',
			country: 'RU',
			value: '+78005553535'
		})

		// `input` in international format.
		// Another country: just trims the `+`.
		parse('+78005553535', '', 'US').should.deep.equal({
			input: '78005553535',
			country: 'US',
			value: '+178005553535'
		})

		// `input` in national format.
		parse('88005553535', '', 'RU').should.deep.equal({
			input: '88005553535',
			country: 'RU',
			value: '+78005553535'
		})

		// `input` in national format.
		parse('88005553535', '8800555353', 'RU').should.deep.equal({
			input: '88005553535',
			country: 'RU',
			value: '+78005553535'
		})

		// Empty `input`.
		parse('', '88005553535', 'RU').should.deep.equal({
			input: '',
			country: 'RU',
			value: undefined
		})
	})

	it('should parse input (`international: false` and no country selected)', () => {
		// If `international` is `false` then it means that
		// "International" option should not be available,
		// so it doesn't handle the cases when it is available.

		const parse = (input) => parseInput(input, {
			prevParsedInput: '',
			international: false,
			metadata
		})

		// `input` in international format.
		// No country calling code.
		parse('+').should.deep.equal({
			input: '+',
			country: undefined,
			value: undefined
		})

		// `input` in international format.
		// Just country calling code.
		parse('+7').should.deep.equal({
			input: '+7',
			country: undefined,
			value: '+7'
		})

		// `input` in international format.
		// Country calling code and first digit.
		parse('+78').should.deep.equal({
			input: '8',
			country: 'RU',
			value: undefined
		})

		// `input` in international format.
		// Country calling code and first two digits.
		parse('+788').should.deep.equal({
			input: '88',
			country: 'RU',
			value: '+788'
		})

		// `input` in international format.
		// Full number.
		parse('+78005553535').should.deep.equal({
			input: '88005553535',
			country: 'RU',
			value: '+78005553535'
		})
	})

	it('should get initial parsed input', () => {
		getInitialParsedInput({
			value: '+78005553535',
			defaultCountry: 'RU',
			international: false,
			metadata
		}).should.equal('+78005553535')

		getInitialParsedInput({
			value: '+78005553535',
			defaultCountry: 'RU',
			international: true,
			metadata
		}).should.equal('+78005553535')

		getInitialParsedInput({
			value: undefined,
			defaultCountry: 'RU',
			international: true,
			metadata
		}).should.equal('+7')

		expect(getInitialParsedInput({
			value: undefined,
			defaultCountry: 'RU',
			international: false,
			metadata
		})).to.be.undefined

		expect(getInitialParsedInput({
			value: undefined,
			international: false,
			metadata
		})).to.be.undefined
	})

	it('should get initial parsed input (has `phoneNumber` that has `country`)', () => {
		const phoneNumber = parsePhoneNumber('+78005553535', metadata)
		getInitialParsedInput({
			value: phoneNumber.number,
			defaultCountry: 'RU',
			useNationalFormat: true,
			phoneNumber,
			metadata
		}).should.equal('88005553535')
	})

	it('should get initial parsed input (has `phoneNumber` that has no `country`)', () => {
		const phoneNumber = parsePhoneNumber('+870773111632', metadata)
		getInitialParsedInput({
			value: phoneNumber.number,
			defaultCountry: 'RU',
			useNationalFormat: true,
			phoneNumber,
			metadata
		}).should.equal('+870773111632')
	})
})