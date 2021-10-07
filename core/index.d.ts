import {
	Metadata,
	Labels,
	Props as BaseProps,
	State
} from '../index.d';

interface Props extends BaseProps {
  metadata: Metadata;
  labels: Labels;
}

type PhoneInputWithCountrySelectType = React.ComponentClass<Props, State<Props>>;

declare const PhoneInputWithCountrySelect: PhoneInputWithCountrySelectType;

export default PhoneInputWithCountrySelect;