export default function Divider({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {

    // Map string sizes to pixel values
    const heights = {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '32px'
    };

    // Fallback to 'md' if something weird is passed
    const height = heights[size] || heights['md'];

    return (
        <div
            className="divider"
            style={{
                width: '100%',
                marginTop: height,
                marginBottom: height
            }}
        />
    )
}
