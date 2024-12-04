import { App, Plugin, Menu, Modal, Notice, MenuItem, TAbstractFile } from 'obsidian';
import { ColorFolderSettings, ColorFolderPluginInterface } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { ColorSettingsModal } from './modals/ColorSettingsModal';
import { ColorSettingsTab } from './settings/ColorSettingsTab';

export default class ColorFolderPlugin extends Plugin implements ColorFolderPluginInterface {
    settings: ColorFolderSettings;
    private styleEl: HTMLStyleElement;
    private activeModals: Set<ColorSettingsModal> = new Set();

    async onload() {
        await this.loadSettings();
        
        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
        
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                menu.addItem((item: MenuItem) => {
                    item
                        .setTitle('Customize appearance')
                        .setIcon('palette')
                        .onClick(() => {
                            // Close any existing modals
                            this.activeModals.forEach(modal => modal.close());
                            this.activeModals.clear();

                            // Create and open new modal
                            const modal = new ColorSettingsModal(this.app, this, file.path);
                            this.activeModals.add(modal);
                            
                            // Override the modal's close method to ensure cleanup
                            const originalClose = modal.close.bind(modal);
                            modal.close = () => {
                                this.activeModals.delete(modal);
                                originalClose();
                            };

                            modal.open();
                        });
                });
            })
        );

        this.addSettingTab(new ColorSettingsTab(this.app, this));
        this.updateStyles();
    }

    onunload() {
        // Close all open modals
        this.activeModals.forEach(modal => {
            try {
                modal.close();
            } catch (e) {
                console.error('Error closing modal:', e);
            }
        });
        this.activeModals.clear();

        // Remove style element
        if (this.styleEl && this.styleEl.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
        }

        // Additional cleanup of any modal elements that might be left
        document.querySelectorAll('.color-folders-files-modal').forEach(el => {
            try {
                el.remove();
            } catch (e) {
                console.error('Error removing modal element:', e);
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.updateStyles();
    }

    updateStyles() {
        const cssRules: string[] = [];
        const processedPaths = new Set<string>();
        
        // Add base styles for the nav items
        cssRules.push(`
            .nav-folder-title,
            .nav-file-title {
                transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
            }
        `);

        const sortedPaths = Object.entries(this.settings.styles)
            .sort(([a], [b]) => b.length - a.length);

        for (const [path, style] of sortedPaths) {
            if (!processedPaths.has(path)) {
                const selector = this.getFileSelector(path);
                const subfolderSelector = this.getSubfolderSelector(path);
                const filesSelector = this.getFilesSelector(path);

                const rules: string[] = [];
                if (style.backgroundColor) rules.push(`background-color: ${style.backgroundColor}`);
                if (style.textColor) rules.push(`color: ${style.textColor}`);
                if (style.isBold) rules.push('font-weight: bold');
                if (style.isItalic) rules.push('font-style: italic');
                if (typeof style.opacity === 'number') rules.push(`opacity: ${style.opacity}`);

                if (rules.length > 0) {
                    // Apply styles to the target path
                    cssRules.push(`${selector} { ${rules.join('; ')}; }`);

                    // Apply styles to subfolders if enabled
                    if (style.applyToSubfolders) {
                        cssRules.push(`${subfolderSelector} { ${rules.join('; ')}; }`);
                    }

                    // Apply styles to files if enabled
                    if (style.applyToFiles) {
                        cssRules.push(`${filesSelector} { ${rules.join('; ')}; }`);
                    }
                }

                processedPaths.add(path);
            }
        }

        this.styleEl.textContent = cssRules.join('\n');
    }

    private getFileSelector(path: string): string {
        const escapedPath = CSS.escape(path);
        return `.nav-folder-title[data-path="${escapedPath}"], .nav-file-title[data-path="${escapedPath}"]`;
    }

    private getSubfolderSelector(path: string): string {
        const escapedPath = CSS.escape(path);
        return `.nav-folder-title[data-path^="${escapedPath}/"]`;
    }

    private getFilesSelector(path: string): string {
        const escapedPath = CSS.escape(path);
        return `.nav-file-title[data-path^="${escapedPath}/"]`;
    }

    async confirmOverwritePreset(name: string): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Overwrite preset');
            modal.contentEl.createEl('p', {
                text: `A preset named "${name}" already exists. Do you want to overwrite it?`
            });
            
            modal.contentEl.createDiv('modal-button-container', (buttonContainer) => {
                buttonContainer.createEl('button', { text: 'Cancel' })
                    .addEventListener('click', () => {
                        modal.close();
                        resolve(false);
                    });

                const confirmButton = buttonContainer.createEl('button', {
                    cls: 'mod-cta',
                    text: 'Overwrite'
                });
                confirmButton.addEventListener('click', () => {
                    modal.close();
                    resolve(true);
                });
            });
            
            modal.open();
        });
    }
}
