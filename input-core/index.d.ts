// React TypeScript Cheatsheet doesn't recommend using `React.FunctionalComponent`.
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components

import * as React from 'react';

import {
	Metadata
} from '../index.d';

import {
	Props
} from '../input/index.d';

interface PropsWithMetadata extends Props {
	metadata: Metadata;
}

type PhoneInputComponentType = (props: PropsWithMetadata) => JSX.Element;

declare const PhoneInput: PhoneInputComponentType;

export default PhoneInput;