import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/prices";

interface MoneyInputProps {
    label?: string;
    value?: number | null;
    placeholder?: string;
    disabled?: boolean;
    onChange: (value: number) => void;
    currency?: string; // por defecto $
    id?: string;
}

export function MoneyInput({
    label,
    value,
    placeholder,
    disabled,
    onChange,
    currency = "$",
    id,
}: MoneyInputProps) {
    const formattedValue = formatCurrency(value ?? 0)
    console.log({ formattedValue });
    return (
        <div className="flex flex-col gap-2">
            {label && <Label htmlFor={id}>{label}</Label>}

            <InputGroup>
                <InputGroupInput
                    id={id}
                    type="number"
                    placeholder={placeholder || label}
                    disabled={disabled}
                    value={value ?? undefined}
                    onChange={(e) => onChange(Number(e.target.value))}
                />

                <InputGroupAddon align="inline-start">
                    {currency}
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}
