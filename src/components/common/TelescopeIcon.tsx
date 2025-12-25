import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
}

export const TelescopeIcon = ({ size = 18, color = "#f9a8d4", ...props }: IconProps) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {/* The main tube body */}
            <path d="M17 5 7 15" />
            <path d="M21 9 11 19" />
            {/* Connecting ends */}
            <path d="M21 9 17 5" />
            <path d="M11 19 7 15" />
            {/* The eyepiece bit pointing down-left */}
            <path d="M7 15 4 18" />
            {/* The tripod legs */}
            <path d="M11 21 14 12 17 21" />
            {/* The mount band across the tube */}
            <path d="M11 15 17 9" />
        </svg>
    );
};