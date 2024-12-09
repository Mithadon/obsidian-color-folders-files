import { App, Plugin, Modal } from 'obsidian';
import { ColorFolderSettings, ColorFolderPluginInterface } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { ColorSettingsTab } from './settings/ColorSettingsTab';
import { StyleManager } from './core/StyleManager';
import { EventManager } from './core/EventManager';

export default class ColorFolderPlugin extends Plugin implements ColorFolderPluginInterface {
    settings: ColorFolderSettings;
    private styleManager: StyleManager;
    private eventManager: EventManager;

    async onload() {
        await this.loadSettings();
        
        // Initialize managers
        this.styleManager = new StyleManager();
        this.eventManager = new EventManager(this.app, this);
        
        // Register events
        this.eventManager.registerEvents();

        // Add settings tab
        this.addSettingTab(new ColorSettingsTab(this.app, this));
        
        // Update styles
        this.updateStyles();
    }

    onunload() {
        this.styleManager.cleanup();
        this.eventManager.cleanup();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.updateStyles();
    }

    updateStyles() {
        this.styleManager.updateStyles(this.settings.styles);
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
