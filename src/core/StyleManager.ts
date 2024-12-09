import { StyleSettings } from '../types';

export class StyleManager {
    private styleEl: HTMLStyleElement;

    constructor() {
        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
    }

    updateStyles(styles: { [path: string]: StyleSettings }) {
        const cssRules: string[] = [];

        // Add base transitions
        cssRules.push(`
            .nav-folder-title,
            .nav-file-title,
            .preview-item {
                transition: background-color 0.1s ease, opacity 0.1s ease !important;
            }
        `);

        for (const [path, style] of Object.entries(styles)) {
            const escapedPath = CSS.escape(path);

            // Folder rules
            if (style.backgroundColor) {
                cssRules.push(`
                    .nav-folder-title[data-path="${escapedPath}"] {
                        background-color: ${style.backgroundColor} !important;
                    }

                    /* Light mode: lighten on hover */
                    body.theme-light .nav-folder-title[data-path="${escapedPath}"]:hover {
                        background-color: color-mix(in srgb, white 20%, ${style.backgroundColor}) !important;
                    }

                    /* Dark mode: darken on hover */
                    body.theme-dark .nav-folder-title[data-path="${escapedPath}"]:hover {
                        background-color: color-mix(in srgb, black 20%, ${style.backgroundColor}) !important;
                    }
                `);
            }

            if (style.textColor) {
                cssRules.push(`
                    .nav-folder-title[data-path="${escapedPath}"],
                    .nav-folder-title[data-path="${escapedPath}"]:hover {
                        color: ${style.textColor} !important;
                    }
                `);
            }

            // File rules
            if (style.backgroundColor) {
                cssRules.push(`
                    .nav-file-title[data-path="${escapedPath}"] {
                        background-color: ${style.backgroundColor} !important;
                    }

                    /* Light mode: lighten on hover */
                    body.theme-light .nav-file-title[data-path="${escapedPath}"]:hover {
                        background-color: color-mix(in srgb, white 20%, ${style.backgroundColor}) !important;
                    }

                    /* Dark mode: darken on hover */
                    body.theme-dark .nav-file-title[data-path="${escapedPath}"]:hover {
                        background-color: color-mix(in srgb, black 20%, ${style.backgroundColor}) !important;
                    }
                `);
            }

            if (style.textColor) {
                cssRules.push(`
                    .nav-file-title[data-path="${escapedPath}"],
                    .nav-file-title[data-path="${escapedPath}"]:hover {
                        color: ${style.textColor} !important;
                    }
                `);
            }

            // Other styles
            if (style.isBold) {
                cssRules.push(`
                    .nav-folder-title[data-path="${escapedPath}"],
                    .nav-file-title[data-path="${escapedPath}"] {
                        font-weight: bold !important;
                    }
                `);
            }

            if (style.isItalic) {
                cssRules.push(`
                    .nav-folder-title[data-path="${escapedPath}"],
                    .nav-file-title[data-path="${escapedPath}"] {
                        font-style: italic !important;
                    }
                `);
            }

            if (typeof style.opacity === 'number') {
                cssRules.push(`
                    .nav-folder-title[data-path="${escapedPath}"],
                    .nav-file-title[data-path="${escapedPath}"] {
                        opacity: ${style.opacity} !important;
                    }
                    .nav-folder-title[data-path="${escapedPath}"]:hover,
                    .nav-file-title[data-path="${escapedPath}"]:hover {
                        opacity: ${Math.min(1, style.opacity + 0.15)} !important;
                    }
                `);
            }

            // Subfolders
            if (style.applyToSubfolders) {
                if (style.backgroundColor) {
                    cssRules.push(`
                        .nav-folder-title[data-path^="${escapedPath}/"] {
                            background-color: ${style.backgroundColor} !important;
                        }

                        /* Light mode: lighten on hover */
                        body.theme-light .nav-folder-title[data-path^="${escapedPath}/"]:hover {
                            background-color: color-mix(in srgb, white 20%, ${style.backgroundColor}) !important;
                        }

                        /* Dark mode: darken on hover */
                        body.theme-dark .nav-folder-title[data-path^="${escapedPath}/"]:hover {
                            background-color: color-mix(in srgb, black 20%, ${style.backgroundColor}) !important;
                        }
                    `);
                }

                if (style.textColor) {
                    cssRules.push(`
                        .nav-folder-title[data-path^="${escapedPath}/"],
                        .nav-folder-title[data-path^="${escapedPath}/"]:hover {
                            color: ${style.textColor} !important;
                        }
                    `);
                }

                if (style.isBold) {
                    cssRules.push(`
                        .nav-folder-title[data-path^="${escapedPath}/"] {
                            font-weight: bold !important;
                        }
                    `);
                }

                if (style.isItalic) {
                    cssRules.push(`
                        .nav-folder-title[data-path^="${escapedPath}/"] {
                            font-style: italic !important;
                        }
                    `);
                }

                if (typeof style.opacity === 'number') {
                    cssRules.push(`
                        .nav-folder-title[data-path^="${escapedPath}/"] {
                            opacity: ${style.opacity} !important;
                        }
                        .nav-folder-title[data-path^="${escapedPath}/"]:hover {
                            opacity: ${Math.min(1, style.opacity + 0.15)} !important;
                        }
                    `);
                }
            }

            // Files
            if (style.applyToFiles) {
                if (style.backgroundColor) {
                    cssRules.push(`
                        .nav-file-title[data-path^="${escapedPath}/"] {
                            background-color: ${style.backgroundColor} !important;
                        }

                        /* Light mode: lighten on hover */
                        body.theme-light .nav-file-title[data-path^="${escapedPath}/"]:hover {
                            background-color: color-mix(in srgb, white 20%, ${style.backgroundColor}) !important;
                        }

                        /* Dark mode: darken on hover */
                        body.theme-dark .nav-file-title[data-path^="${escapedPath}/"]:hover {
                            background-color: color-mix(in srgb, black 20%, ${style.backgroundColor}) !important;
                        }
                    `);
                }

                if (style.textColor) {
                    cssRules.push(`
                        .nav-file-title[data-path^="${escapedPath}/"],
                        .nav-file-title[data-path^="${escapedPath}/"]:hover {
                            color: ${style.textColor} !important;
                        }
                    `);
                }

                if (style.isBold) {
                    cssRules.push(`
                        .nav-file-title[data-path^="${escapedPath}/"] {
                            font-weight: bold !important;
                        }
                    `);
                }

                if (style.isItalic) {
                    cssRules.push(`
                        .nav-file-title[data-path^="${escapedPath}/"] {
                            font-style: italic !important;
                        }
                    `);
                }

                if (typeof style.opacity === 'number') {
                    cssRules.push(`
                        .nav-file-title[data-path^="${escapedPath}/"] {
                            opacity: ${style.opacity} !important;
                        }
                        .nav-file-title[data-path^="${escapedPath}/"]:hover {
                            opacity: ${Math.min(1, style.opacity + 0.15)} !important;
                        }
                    `);
                }
            }

            // Preview items with hover
            if (style.backgroundColor) {
                cssRules.push(`
                    .preview-item[data-path="${escapedPath}"] {
                        background-color: ${style.backgroundColor} !important;
                        ${style.textColor ? `color: ${style.textColor} !important;` : ''}
                        ${style.isBold ? 'font-weight: bold !important;' : ''}
                        ${style.isItalic ? 'font-style: italic !important;' : ''}
                        ${typeof style.opacity === 'number' ? `opacity: ${style.opacity} !important;` : ''}
                    }

                    /* Light mode: lighten on hover */
                    body.theme-light .preview-item[data-path="${escapedPath}"]:hover {
                        background-color: color-mix(in srgb, white 20%, ${style.backgroundColor}) !important;
                        ${typeof style.opacity === 'number' ? `opacity: ${Math.min(1, style.opacity + 0.15)} !important;` : ''}
                    }

                    /* Dark mode: darken on hover */
                    body.theme-dark .preview-item[data-path="${escapedPath}"]:hover {
                        background-color: color-mix(in srgb, black 20%, ${style.backgroundColor}) !important;
                        ${typeof style.opacity === 'number' ? `opacity: ${Math.min(1, style.opacity + 0.15)} !important;` : ''}
                    }
                `);
            }
        }

        this.styleEl.textContent = cssRules.join('\n');
    }

    cleanup() {
        if (this.styleEl && this.styleEl.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
        }
    }
}
