const round = (val: number) => Math.round(val * 10) / 10;

export const Measure = ({ label, value, unit, variant = "normal", highlight }: { label?: string, value: string | number, unit?: string, variant?: 'normal' | 'minified', highlight?: boolean }) => {
    const displayValue = typeof value === 'number' ? round(value) : value;

    return (
        <div className={`measure ${variant}`}>
            {variant === "normal" && <p className="label">{label}</p>}
            <p className={`value ${highlight ? 'highlight' : ''}`}>{displayValue} <span className="unit">{unit}</span></p>
        </div>
    )
}
