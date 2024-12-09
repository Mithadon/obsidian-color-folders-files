import { Menu, MenuItem, TAbstractFile, App } from 'obsidian';
import { ColorSettingsModal } from '../modals/ColorSettingsModal';
import { ColorFolderPluginInterface } from '../types';

export class EventManager {
    private activeModals: Set<ColorSettingsModal> = new Set();

    constructor(
        private app: App,
        private plugin: ColorFolderPluginInterface
    ) {}

    registerEvents() {
        this.plugin.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                this.handleFileMenu(menu, file);
            })
        );
    }

    private handleFileMenu(menu: Menu, file: TAbstractFile) {
        menu.addItem((item: MenuItem) => {
            item
                .setTitle('Customize appearance')
                .setIcon('palette')
                .onClick(() => {
                    // Close any existing modals
                    this.activeModals.forEach(modal => modal.close());
                    this.activeModals.clear();

                    // Create and open new modal
                    const modal = new ColorSettingsModal(this.app, this.plugin, file.path);
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
    }

    cleanup() {
        // Close all open modals
        this.activeModals.forEach(modal => {
            try {
                modal.close();
            } catch (e) {
                console.error('Error closing modal:', e);
            }
        });
        this.activeModals.clear();

        // Additional cleanup of any modal elements that might be left
        document.querySelectorAll('.color-folders-files-modal').forEach(el => {
            try {
                el.remove();
            } catch (e) {
                console.error('Error removing modal element:', e);
            }
        });
    }
}
