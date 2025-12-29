export const RefButton = ({
    children,
    disabled,
    onClick,
    btnRef
}: {
    children: React.ReactNode;
    disabled: boolean;
    onClick?: () => void;
    btnRef: React.RefObject<HTMLButtonElement> | undefined;
}) => {
    return <button
        className={" px-4 py-2 rounded-md font-semibold text-sm bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 " + (disabled ? "opacity-50 cursor-not-allowed" : "")}
        disabled={disabled}
        onClick={onClick ?? (() => { })}
        ref={btnRef}
    >{children}
    </button>
}