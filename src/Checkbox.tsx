import { ChangeEventHandler, useState } from 'react';

interface CheckboxProps {
    label: string;
    initialChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
}
const Checkbox: React.FC<CheckboxProps> = ({ label, initialChecked = false, onChange, disabled = false }) => {
  const [isChecked, setIsChecked] = useState(initialChecked);
  
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const newValue = e.target.checked;
    setIsChecked(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };
  
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
        />
        <div
          className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${
            isChecked 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-white border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isChecked && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
    </label>
  );
};

export default Checkbox;