import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/prices";

interface MoneyInputProps {
    label?: string;
    value?: number | null;
    placeholder?: string;
    disabled?: boolean;
    onChange: (value: number | null) => void;
    id?: string;
    resetKey?: string;
}

export function MoneyInput({
    label,
    value,
    disabled,
    onChange,
    id,
    resetKey
}: MoneyInputProps) {


    const formattedValue = formatCurrency(value ?? 0)

    return (
        <div className="flex flex-col gap-2">
            {label && <Label htmlFor={id}>{label}</Label>}

            <InputGroup className="relative">
                <span className="absolute z-10 top-[50%] left-2 translate-y-[-50%]">{formattedValue}</span>
                <InputGroupInput
                    key={resetKey}
                    id={id}
                    disabled={disabled}
                    value={value ?? undefined}
                    type="number"
                    onChange={(e) => {
                        const newValue = e.target.value;
                        const formattedValue = parseFloat(newValue).toFixed(2);
                        const numberValue = Number(formattedValue);
                        onChange(newValue === "" ? null : numberValue);
                    }}
                    className="pl-6 text-white"
                />

                {/* <InputGroupAddon align="inline-start">
                    {currency}
                </InputGroupAddon> */}
            </InputGroup>
        </div>
    );
}
