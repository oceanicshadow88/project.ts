import React from 'react';

interface Option {
  label: string;
  value: string;
}

interface CustomRadioGroupProps {
  options: Option[];
  name: string;
  selected: string; // Selected value passed from the parent
  onChange: (value: any) => void; // Callback to notify parent
}

function RadioGroup({ options, name, selected, onChange }: CustomRadioGroupProps) {
  return (
    <div className="flex flex-col space-y-2">
      {options.map((option) => (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <label
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
          key={option.value}
          htmlFor={name}
          onClick={() => onChange({ target: { name, value: option } })}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selected === option.value}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700 select-none">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export default RadioGroup;
