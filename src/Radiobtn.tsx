import { FC, ReactEventHandler } from "react";

interface RadioButtonProps {
    id: string;
    name: string;
    label: string;
    value: string;
    checked: boolean;
    onChange: ReactEventHandler<HTMLInputElement>;
    disabled?: boolean;
}
const RadioButton: FC<RadioButtonProps> = ({ 
  id, 
  name, 
  label, 
  value, 
  checked, 
  onChange, 
  disabled = false 
}) => {
  return (
    <label 
      htmlFor={id} 
      className={`flex items-center space-x-2 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <div className="relative inline-flex items-center">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 border rounded-full flex items-center justify-center transition-colors ${
            checked 
              ? 'border-blue-500' 
              : 'border-gray-300'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          {checked && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          )}
        </div>
      </div>
      <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
    </label>
  );
};

interface RadioGroupProps {
    name: string;
    options: { label: string; value: string; disabled?: boolean }[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}
const RadioGroup: FC<RadioGroupProps> = ({ 
  name, 
  options, 
  value, 
  onChange, 
  label,
  className = "" 
}) => {
  return (
    <fieldset className={`space-y-2 ${className}`}>
      {label && <legend className="text-sm font-medium text-gray-700 mb-1">{label}</legend>}
      
      {options.map((option) => (
        <RadioButton
          key={option.value}
          id={`${name}-${option.value}`}
          name={name}
          label={option.label}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          disabled={option.disabled}
        />
      ))}
    </fieldset>
  );
};

export { RadioButton, RadioGroup };