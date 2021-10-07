// React TypeScript Cheatsheet doesn't recommend using `React.FunctionalComponent` (`React.FC`).
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components

import * as React from 'react';

import { Control } from 'react-hook-form';

import {
	Value
} from '../index.d';

import {
  ReactHookFormComponentProps
} from '../react-hook-form/index.d';

import {
  Props as BaseProps
} from '../input/index.d';

export interface Props extends BaseProps, ReactHookFormComponentProps<HTMLElement> {
}

type PhoneInputType = (props: Props) => JSX.Element;

declare const PhoneInput: PhoneInputType;

export default PhoneInput;