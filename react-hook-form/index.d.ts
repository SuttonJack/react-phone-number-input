// React TypeScript Cheatsheet doesn't recommend using `React.FunctionalComponent` (`React.FC`).
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components

import * as React from 'react';

import { Control } from 'react-hook-form';

import {
  Value,
  State,
  Props as BaseProps
} from '../index.d';

export interface ReactHookFormComponentProps<InputElement> {
  name: string;
  defaultValue?: Value;
  control: Control;
  rules?: object;
  onChange?(event: React.ChangeEvent<InputElement>): void;
  onBlur?(event: React.FocusEvent<InputElement>): void;
  // A quote from `react-hook-form`:
  // Without `shouldUnregister: true`, an input value would be retained when input is removed.
  // Setting `shouldUnregister: true` makes the form behave more closer to native.
  shouldUnregister?: boolean;
}

export interface Props extends BaseProps, ReactHookFormComponentProps<HTMLInputElement> {
}

type PhoneInputWithCountrySelectType = React.ComponentClass<Props, State<Props>>

declare const PhoneInputWithCountrySelect: PhoneInputWithCountrySelectType;

export default PhoneInputWithCountrySelect;