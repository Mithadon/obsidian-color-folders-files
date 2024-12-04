import { ColorFolderSettings, StyleSettings } from './types';

export const DEFAULT_SETTINGS: ColorFolderSettings = {
    styles: {},
    presets: {
        'Default': {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            isBold: false,
            isItalic: false,
            opacity: 1,
            applyToSubfolders: false,
            applyToFiles: false
        }
    }
};

export const DEFAULT_STYLE: StyleSettings = {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    isBold: false,
    isItalic: false,
    opacity: 1,
    applyToSubfolders: false,
    applyToFiles: false
};
