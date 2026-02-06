const CheckBoxesSelector = ({
  options,
  selectedOption,
  onSelectOption,
  disabled,
}: {
  options: { label: string; value: string }[];
  selectedOption: string | null;
  onSelectOption: (value: string | null) => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center">
          <input
            type="checkbox"
            disabled={disabled}
            id={option.value}
            checked={selectedOption === option.value}
            onChange={() =>
              onSelectOption(
                selectedOption === option.value ? null : option.value
              )
            }
          />
          <label htmlFor={option.value} className="ml-2">
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default CheckBoxesSelector;
