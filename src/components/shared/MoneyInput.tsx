import { useState, useEffect } from "react";
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
    const [rawInput, setRawInput] = useState<string>(value != null ? String(value) : "");

    // Sync rawInput when value changes externally (e.g. parent resets it)
    useEffect(() => {
        const parsed = rawInput === "" ? null : parseFloat(rawInput);
        const parsedMatches = parsed === value || (value == null && rawInput === "");
        if (!parsedMatches) {
            setRawInput(value != null ? String(value) : "");
        }
    }, [value]);

    // Reset internal string state when resetKey changes
    useEffect(() => {
        setRawInput(value != null ? String(value) : "");
    }, [resetKey]);

    const formattedValue = formatCurrency(value ?? 0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        // Only allow digits and a single decimal point
        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;

        setRawInput(raw);

        if (raw === "" || raw === ".") {
            onChange(null);
            return;
        }

        // Intermediate state like "1." — don't propagate yet
        if (raw.endsWith(".")) return;

        const parsed = parseFloat(raw);
        onChange(isNaN(parsed) ? null : parsed);
    };

    const handleBlur = () => {
        if (rawInput === "" || rawInput === ".") {
            setRawInput("");
            onChange(null);
            return;
        }

        const parsed = parseFloat(rawInput);
        if (!isNaN(parsed)) {
            setRawInput(String(parsed));
            onChange(parsed);
        } else {
            setRawInput("");
            onChange(null);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {label && <Label htmlFor={id}>{label}</Label>}

            <InputGroup className="relative">
                <span className="absolute z-10 top-[50%] left-2 translate-y-[-50%]">{formattedValue}</span>
                <InputGroupInput
                    key={resetKey}
                    id={id}
                    disabled={disabled}
                    value={rawInput}
                    type="text"
                    inputMode="decimal"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="pl-6 text-white"
                />
            </InputGroup>
        </div>
    );
}
