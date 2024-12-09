/**
 * Converts a hex color to RGB components
 */
function hexToRGB(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        throw new Error('Invalid hex color');
    }
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    };
}

/**
 * Converts RGB components to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Calculates the relative luminance of a color
 * Used for determining contrast
 */
function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generates a hover color based on the base color
 * For light colors, it darkens them slightly
 * For dark colors, it lightens them slightly
 */
export function generateHoverColor(baseColor: string): string {
    const rgb = hexToRGB(baseColor);
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    
    // Determine if color is light or dark
    const isLight = luminance > 0.5;
    
    // Adjust the color in the opposite direction of its luminance
    const adjustmentFactor = isLight ? 0.85 : 1.15;  // Darken light colors, lighten dark ones
    
    const newR = Math.min(255, Math.max(0, rgb.r * adjustmentFactor));
    const newG = Math.min(255, Math.max(0, rgb.g * adjustmentFactor));
    const newB = Math.min(255, Math.max(0, rgb.b * adjustmentFactor));
    
    return rgbToHex(newR, newG, newB);
}

/**
 * Generates a contrasting text color (black or white) based on background color
 */
export function getContrastTextColor(backgroundColor: string): string {
    const rgb = hexToRGB(backgroundColor);
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Adjusts the opacity of a hex color
 */
export function adjustOpacity(color: string, opacity: number): string {
    const rgb = hexToRGB(color);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}
