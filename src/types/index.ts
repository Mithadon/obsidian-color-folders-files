export interface ColorFolderSettings {
    styles: {
        [path: string]: StyleSettings
    };
    presets: {
        [name: string]: StyleSettings
    };
}

export interface StyleSettings {
    backgroundColor?: string;
    textColor?: string;
    isBold?: boolean;
    isItalic?: boolean;
    opacity?: number;
    applyToSubfolders?: boolean;
    applyToFiles?: boolean;
}

export interface ColorFolderPluginInterface {
    settings: ColorFolderSettings;
    saveSettings(): Promise<void>;
    confirmOverwritePreset(name: string): Promise<boolean>;
}
