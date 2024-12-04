import { 
    App, 
    Plugin, 
    PluginSettingTab, 
    Setting, 
    Menu, 
    TAbstractFile,
    Modal,
    Notice,
    MenuItem,
    TextComponent,
    ColorComponent,
    ToggleComponent,
    SliderComponent,
    DropdownComponent
} from 'obsidian';

interface ColorFolderSettings {
    styles: {
        [path: string]: StyleSettings
    };
    presets: {
        [name: string]: StyleSettings
    };
}

interface StyleSettings {
    backgroundColor?: string;
    textColor?: string;
    isBold?: boolean;
    isItalic?: boolean;
    opacity?: number;
    applyToSubfolders?: boolean;
    applyToFiles?: boolean;
}

const DEFAULT_SETTINGS: ColorFolderSettings = {
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

const DEFAULT_STYLE: StyleSettings = {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    isBold: false,
    isItalic: false,
    opacity: 1,
    applyToSubfolders: false,
    applyToFiles: false
};

export default class ColorFolderPlugin extends Plugin {
    settings: ColorFolderSettings;
    private styleEl: HTMLStyleElement;

    async onload() {
        await this.loadSettings();
        
        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
        
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                menu.addItem((item: MenuItem) => {
                    item
                        .setTitle('Customize appearance')
                        .setIcon('palette')
                        .onClick(() => {
                            const modal = new ColorSettingsModal(this.app, this, file);
                            modal.centerModal();
                            modal.open();
                        });
                });
            })
        );

        this.addSettingTab(new ColorSettingsTab(this.app, this));
        this.updateStyles();
    }

    onunload() {
        if (this.styleEl && this.styleEl.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
        }
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
        
        const sortedPaths = Object.entries(this.settings.styles)
            .sort(([a], [b]) => b.length - a.length);

        for (const [path, style] of sortedPaths) {
            if (!processedPaths.has(path)) {
                const rules: string[] = [];
                
                if (style.backgroundColor) rules.push(`background-color: ${style.backgroundColor}`);
                if (style.textColor) rules.push(`color: ${style.textColor}`);
                if (style.isBold) rules.push('font-weight: bold');
                if (style.isItalic) rules.push('font-style: italic');
                if (typeof style.opacity === 'number') rules.push(`opacity: ${style.opacity}`);

                if (rules.length > 0) {
                    cssRules.push(`${this.getFileSelector(path)} { ${rules.join('; ')}; }`);
                    processedPaths.add(path);

                    if (style.applyToSubfolders) {
                        cssRules.push(`${this.getSubfolderSelector(path)} { ${rules.join('; ')}; }`);
                    }
                    
                    if (style.applyToFiles) {
                        cssRules.push(`${this.getFilesSelector(path)} { ${rules.join('; ')}; }`);
                    }
                }
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
            
            new Setting(modal.contentEl)
                .addButton(btn => btn
                    .setButtonText('Cancel')
                    .onClick(() => {
                        modal.close();
                        resolve(false);
                    }))
                .addButton(btn => btn
                    .setButtonText('Overwrite')
                    .setCta()
                    .onClick(() => {
                        modal.close();
                        resolve(true);
                    }));
            
            modal.open();
        });
    }
}

class ColorSettingsModal extends Modal {
    plugin: ColorFolderPlugin;
    file: TAbstractFile;
    style: StyleSettings;
    presetNameInput: HTMLInputElement;
    previewEl: HTMLElement;
    // Store control references
    private bgColorPicker: ColorComponent;
    private textColorPicker: ColorComponent;
    private boldToggle: ToggleComponent;
    private italicToggle: ToggleComponent;
    private opacitySlider: SliderComponent;
    private subfolderToggle: ToggleComponent;
    private filesToggle: ToggleComponent;

    constructor(app: App, plugin: ColorFolderPlugin, file: TAbstractFile) {
        super(app);
        this.plugin = plugin;
        this.file = file;
        this.style = { ...(plugin.settings.styles[file.path] || {}) };
        this.containerEl.addClass('color-folders-files-modal');
    }
    
    centerModal() {
        const modalWidth = 300;  // Increased from 200px
        const modalHeight = 350;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const finalX = (viewportWidth - modalWidth) / 2;
        const finalY = (viewportHeight - modalHeight) / 2;

        this.containerEl.style.left = finalX + 'px';
        this.containerEl.style.top = finalY + 'px';
        this.containerEl.style.position = 'absolute';
        this.containerEl.style.width = modalWidth + 'px';
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.empty();

        // Preview section
        const previewSection = contentEl.createDiv('preview-section');
        this.previewEl = previewSection.createDiv('preview-item');
        this.previewEl.setText(this.file.name);
        this.updatePreview();

        // Background color
        new Setting(contentEl)
            .setName('Background color')
            .addColorPicker(color => {
                this.bgColorPicker = color;
                color.setValue(this.style.backgroundColor || '#ffffff')
                    .onChange(value => {
                        this.style.backgroundColor = value;
                        this.updatePreview();
                    });
            });

        // Text color
        new Setting(contentEl)
            .setName('Text color')
            .addColorPicker(color => {
                this.textColorPicker = color;
                color.setValue(this.style.textColor || '#000000')
                    .onChange(value => {
                        this.style.textColor = value;
                        this.updatePreview();
                    });
            });

        // Bold toggle
        new Setting(contentEl)
            .setName('Bold')
            .addToggle(toggle => {
                this.boldToggle = toggle;
                toggle.setValue(this.style.isBold || false)
                    .onChange(value => {
                        this.style.isBold = value;
                        this.updatePreview();
                    });
            });

        // Italic toggle
        new Setting(contentEl)
            .setName('Italic')
            .addToggle(toggle => {
                this.italicToggle = toggle;
                toggle.setValue(this.style.isItalic || false)
                    .onChange(value => {
                        this.style.isItalic = value;
                        this.updatePreview();
                    });
            });

        // Opacity
        new Setting(contentEl)
            .setName('Opacity')
            .addSlider(slider => {
                this.opacitySlider = slider;
                slider.setLimits(0, 1, 0.1)
                    .setValue(this.style.opacity || 1)
                    .onChange(value => {
                        this.style.opacity = value;
                        this.updatePreview();
                    });
            });

        // Apply to subfolders
        new Setting(contentEl)
            .setName('Apply to subfolders')
            .addToggle(toggle => {
                this.subfolderToggle = toggle;
                toggle.setValue(this.style.applyToSubfolders || false)
                    .onChange(value => {
                        this.style.applyToSubfolders = value;
                    });
            });

        // Apply to files
        new Setting(contentEl)
            .setName('Apply to files')
            .addToggle(toggle => {
                this.filesToggle = toggle;
                toggle.setValue(this.style.applyToFiles || false)
                    .onChange(value => {
                        this.style.applyToFiles = value;
                    });
            });

        // Buttons section
        const buttonSection = contentEl.createDiv('button-section');
        
        // Reset button
        new Setting(buttonSection)
            .addButton(button => button
                .setButtonText('Reset')
                .onClick(async () => {
                    delete this.plugin.settings.styles[this.file.path];
                    await this.plugin.saveSettings();
                    this.close();
                    new Notice('Reset to default style');
                }))
            .addButton(button => button
                .setButtonText('Apply')
                .setCta()
                .onClick(async () => {
                    await this.saveChanges();
                    this.close();
                }));

        // Preset section
        if (Object.keys(this.plugin.settings.presets).length > 0) {
            new Setting(contentEl)
                .setName('Preset')
                .addDropdown(dropdown => {
                    Object.keys(this.plugin.settings.presets).forEach(preset => {
                        dropdown.addOption(preset, preset);
                    });
                    return dropdown.onChange(value => {
                        this.style = { ...this.plugin.settings.presets[value] };
                        this.updateControls();
                        this.updatePreview();
                    });
                });
        }
    }

    updateControls() {
        if (this.bgColorPicker) this.bgColorPicker.setValue(this.style.backgroundColor || '#ffffff');
        if (this.textColorPicker) this.textColorPicker.setValue(this.style.textColor || '#000000');
        if (this.boldToggle) this.boldToggle.setValue(this.style.isBold || false);
        if (this.italicToggle) this.italicToggle.setValue(this.style.isItalic || false);
        if (this.opacitySlider) this.opacitySlider.setValue(this.style.opacity || 1);
        if (this.subfolderToggle) this.subfolderToggle.setValue(this.style.applyToSubfolders || false);
        if (this.filesToggle) this.filesToggle.setValue(this.style.applyToFiles || false);
    }

    updatePreview() {
        if (this.style.backgroundColor) this.previewEl.style.backgroundColor = this.style.backgroundColor;
        if (this.style.textColor) this.previewEl.style.color = this.style.textColor;
        this.previewEl.style.fontWeight = this.style.isBold ? 'bold' : 'normal';
        this.previewEl.style.fontStyle = this.style.isItalic ? 'italic' : 'normal';
        if (typeof this.style.opacity === 'number') this.previewEl.style.opacity = this.style.opacity.toString();
    }

    async saveChanges() {
        this.plugin.settings.styles[this.file.path] = this.style;
        await this.plugin.saveSettings();
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class ColorSettingsTab extends PluginSettingTab {
    plugin: ColorFolderPlugin;
    private presetStyle: StyleSettings;

    constructor(app: App, plugin: ColorFolderPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.resetPresetStyle();
    }

    resetPresetStyle() {
        this.presetStyle = { ...DEFAULT_STYLE };
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        // Create new preset section
        new Setting(containerEl).setHeading().setName('Create new preset');
        
        const previewEl = containerEl.createDiv('preview-item');
        previewEl.setText('Preview');
        
        // Background color
        new Setting(containerEl)
            .setName('Background color')
            .addColorPicker(color => color
                .setValue(this.presetStyle.backgroundColor || '#ffffff')
                .onChange(value => {
                    this.presetStyle.backgroundColor = value;
                    this.updatePreview(previewEl);
                }));

        // Text color
        new Setting(containerEl)
            .setName('Text color')
            .addColorPicker(color => color
                .setValue(this.presetStyle.textColor || '#000000')
                .onChange(value => {
                    this.presetStyle.textColor = value;
                    this.updatePreview(previewEl);
                }));

        // Bold toggle
        new Setting(containerEl)
            .setName('Bold')
            .addToggle(toggle => toggle
                .setValue(this.presetStyle.isBold || false)
                .onChange(value => {
                    this.presetStyle.isBold = value;
                    this.updatePreview(previewEl);
                }));

        // Italic toggle
        new Setting(containerEl)
            .setName('Italic')
            .addToggle(toggle => toggle
                .setValue(this.presetStyle.isItalic || false)
                .onChange(value => {
                    this.presetStyle.isItalic = value;
                    this.updatePreview(previewEl);
                }));

        // Opacity
        new Setting(containerEl)
            .setName('Opacity')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.presetStyle.opacity || 1)
                .onChange(value => {
                    this.presetStyle.opacity = value;
                    this.updatePreview(previewEl);
                }));

        // Save preset section with name input and buttons
        let textComponent: TextComponent;
        const savePresetSetting = new Setting(containerEl)
            .setName('Save preset')
            .addText(text => {
                textComponent = text;
                text.setPlaceholder('Preset name')
                    .setValue('');
            })
            .addButton(button => button
                .setButtonText('Reset')
                .onClick(() => {
                    this.resetPresetStyle();
                    this.display();
                }))
            .addButton(button => button
                .setButtonText('Save')
                .setCta()
                .onClick(async () => {
                    const presetName = textComponent.getValue();
                    if (presetName) {
                        if (this.plugin.settings.presets[presetName]) {
                            const shouldOverwrite = await this.plugin.confirmOverwritePreset(presetName);
                            if (!shouldOverwrite) return;
                        }
                        this.plugin.settings.presets[presetName] = { ...this.presetStyle };
                        await this.plugin.saveSettings();
                        textComponent.setValue('');
                        this.display();
                        new Notice(`Preset "${presetName}" saved`);
                    }
                }));

        // Existing presets section
        new Setting(containerEl).setHeading().setName('Existing presets');
        
        Object.entries(this.plugin.settings.presets).forEach(([name, preset]) => {
            const presetContainer = containerEl.createDiv('preset-container');
            
            const previewEl = presetContainer.createDiv('preview-item');
            previewEl.setText(name);
            this.updatePreview(previewEl, preset);

            new Setting(presetContainer)
                .addButton(btn => btn
                    .setIcon('trash')
                    .setTooltip('Delete preset')
                    .onClick(async () => {
                        delete this.plugin.settings.presets[name];
                        await this.plugin.saveSettings();
                        this.display();
                        new Notice(`Preset "${name}" deleted`);
                    }));
        });
    }

    private updatePreview(previewEl: HTMLElement, style: StyleSettings = this.presetStyle) {
        if (style.backgroundColor) previewEl.style.backgroundColor = style.backgroundColor;
        if (style.textColor) previewEl.style.color = style.textColor;
        previewEl.style.fontWeight = style.isBold ? 'bold' : 'normal';
        previewEl.style.fontStyle = style.isItalic ? 'italic' : 'normal';
        if (typeof style.opacity === 'number') previewEl.style.opacity = style.opacity.toString();
    }
}
