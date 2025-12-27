interface PinIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    color?: string;
}

export const PinIcon: React.FC<PinIconProps> = ({
    size = 25,
    color = "#fecdd3", // Default to the pink from your snippet
    ...props
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none" // standard reset
            {...props}
        >
            {/* Shadow Base */}
            <ellipse
                cx="32"
                cy="61"
                rx="16"
                ry="4"
                fill={color}
                fillOpacity={0.6}
            />

            {/* Solid Pin Body */}
            <path
                d="M 32 61
           C 34 56, 49 45, 49 34
           A 17 17 0 1 0 15 34
           C 15 45, 30 56, 32 61 Z"
                fill={color}
            />
        </svg>
    );
};