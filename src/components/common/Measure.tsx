const round = (val: number) => Math.round(val * 10) / 10;

export const Measure = ({ label, value, unit, variant = "normal" }: { label: string, value: string | number, unit?: string, variant?: 'normal' | 'minified' }) => {
    const displayValue = typeof value === 'number' ? round(value) : value;

    return (
        <div className={`measure ${variant}`}>
            {variant === "normal" && <p className="label">{label}</p>}
            <p className="value">{displayValue} <span className="unit">{unit}</span></p>
        </div>
    )
}
