import { EventRef } from 'obsidian';

export interface ColorFolderSettings {
    styles: {
        [path: string]: StyleSettings
    };
    presets: {
        [name: string]: StyleSettings
    };
    presetOrder: string[];
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
    manifest: {
        version: string;
    };
    saveSettings(): Promise<void>;
    confirmOverwritePreset(name: string): Promise<boolean>;
    registerEvent(event: EventRef): void;
}
