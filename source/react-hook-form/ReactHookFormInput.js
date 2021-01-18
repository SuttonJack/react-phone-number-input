import React, { useRef, useCallback } from 'react'
import { Controller } from 'react-hook-form'
import PropTypes from 'prop-types'

let ReactHookFormInput = ({
  Component,
  name,
  defaultValue,
  control,
  rules,
  onChange: onChange_,
  onBlur: onBlur_,
  className,
  ...rest
}, ref) => {
  const internalRef = useRef()
  const setRef = useCallback((instance) => {
    internalRef.current = instance
    if (ref) {
      ref.current = instance
    }
  }, [])
  const onFocus = useCallback(() => {
    // internalRef.current.disabled = false
    internalRef.current.focus()
  }, [])
  // `feact-hook-form` doesn't know how to properly handle `undefined` values.
  // https://github.com/react-hook-form/react-hook-form/issues/2990
  defaultValue = defaultValue === undefined ? null : defaultValue
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      rules={rules}
      onFocus={onFocus}
      render={({ value, onChange, onBlur }) => {
        const onChangeCombined = useCallback((value) => {
          onChange(value)
          if (onChange_) {
            onChange_(value)
          }
        }, [])
        const onBlurCombined = useCallback((event) => {
          onBlur(event)
          if (onBlur_) {
            onBlur_(event)
          }
        }, [])
        return (
          <Component
            ref={setRef}
            {...rest}
            value={value}
            onChange={onChangeCombined}
            onBlur={onBlurCombined}/>
        )
      }}/>
  )
}

ReactHookFormInput = React.forwardRef(ReactHookFormInput)

ReactHookFormInput.propTypes = {
  Component: PropTypes.elementType.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.string,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string
}

export default ReactHookFormInput
