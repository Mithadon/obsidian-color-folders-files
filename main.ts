import { 
    App, 
    Plugin, 
    PluginSettingTab, 
    Setting, 
    Menu, 
    TAbstractFile,
    Modal,
    Notice
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
    fontWeight?: string;
    fontStyle?: string;
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
            fontWeight: 'normal',
            fontStyle: 'normal',
            opacity: 1,
            applyToSubfolders: false,
            applyToFiles: false
        }
    }
};

export default class ColorFolderPlugin extends Plugin {
    settings: ColorFolderSettings;
    private styleEl: HTMLStyleElement;

    async onload() {
        await this.loadSettings();
        
        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
        
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                menu.addItem((item) => {
                    item
                        .setTitle('Customize appearance')
                        .setIcon('palette')
                        .onClick(() => {
                            new ColorSettingsModal(this.app, this, file).open();
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
        
        // Process styles in reverse order of path length to handle nested paths correctly
        const sortedPaths = Object.entries(this.settings.styles)
            .sort(([a], [b]) => b.length - a.length);

        for (const [path, style] of sortedPaths) {
            if (!processedPaths.has(path)) {
                const rules: string[] = [];
                
                if (style.backgroundColor) rules.push(`background-color: ${style.backgroundColor}`);
                if (style.textColor) rules.push(`color: ${style.textColor}`);
                if (style.fontWeight) rules.push(`font-weight: ${style.fontWeight}`);
                if (style.fontStyle) rules.push(`font-style: ${style.fontStyle}`);
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

    constructor(app: App, plugin: ColorFolderPlugin, file: TAbstractFile) {
        super(app);
        this.plugin = plugin;
        this.file = file;
        this.style = { ...(plugin.settings.styles[file.path] || {}) };
        this.containerEl.addClass('color-folders-files-modal');
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.empty();

        new Setting(contentEl).setHeading().setName('Customize appearance');

        // Preview section
        const previewSection = contentEl.createDiv('preview-section');
        new Setting(previewSection).setHeading().setName('Preview');
        this.previewEl = previewSection.createDiv('preview-item');
        this.previewEl.setText(this.file.name);
        this.updatePreview();

        // Background color
        new Setting(contentEl)
            .setName('Background color')
            .addColorPicker(color => color
                .setValue(this.style.backgroundColor || '#ffffff')
                .onChange(value => {
                    this.style.backgroundColor = value;
                    this.updatePreview();
                }));

        // Text color
        new Setting(contentEl)
            .setName('Text color')
            .addColorPicker(color => color
                .setValue(this.style.textColor || '#000000')
                .onChange(value => {
                    this.style.textColor = value;
                    this.updatePreview();
                }));

        // Font weight
        new Setting(contentEl)
            .setName('Font weight')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'normal': 'Normal',
                    'bold': 'Bold'
                })
                .setValue(this.style.fontWeight || 'normal')
                .onChange(value => {
                    this.style.fontWeight = value;
                    this.updatePreview();
                }));

        // Font style
        new Setting(contentEl)
            .setName('Font style')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'normal': 'Normal',
                    'italic': 'Italic'
                })
                .setValue(this.style.fontStyle || 'normal')
                .onChange(value => {
                    this.style.fontStyle = value;
                    this.updatePreview();
                }));

        // Opacity
        new Setting(contentEl)
            .setName('Opacity')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.style.opacity || 1)
                .onChange(value => {
                    this.style.opacity = value;
                    this.updatePreview();
                }));

        // Apply to subfolders
        new Setting(contentEl)
            .setName('Apply to subfolders')
            .setDesc('Apply this style to all subfolders')
            .addToggle(toggle => toggle
                .setValue(this.style.applyToSubfolders || false)
                .onChange(value => {
                    this.style.applyToSubfolders = value;
                }));

        // Apply to files
        new Setting(contentEl)
            .setName('Apply to files')
            .setDesc('Apply this style to all files within this folder')
            .addToggle(toggle => toggle
                .setValue(this.style.applyToFiles || false)
                .onChange(value => {
                    this.style.applyToFiles = value;
                }));

        // Preset section
        const presetSection = contentEl.createDiv('preset-section');
        new Setting(presetSection).setHeading().setName('Presets');

        // Save as preset
        const presetSetting = new Setting(presetSection)
            .setName('Save as preset')
            .setDesc('Enter a name and click save to create a new preset');
            
        this.presetNameInput = presetSetting.controlEl.createEl('input', {
            type: 'text',
            cls: 'preset-name-input',
            placeholder: 'Preset name'
        });

        presetSetting.addButton(button => button
            .setButtonText('Save preset')
            .onClick(async () => {
                const presetName = this.presetNameInput.value;
                if (presetName) {
                    if (this.plugin.settings.presets[presetName]) {
                        const shouldOverwrite = await this.plugin.confirmOverwritePreset(presetName);
                        if (!shouldOverwrite) return;
                    }
                    this.plugin.settings.presets[presetName] = { ...this.style };
                    await this.plugin.saveSettings();
                    this.presetNameInput.value = '';
                    new Notice(`Preset "${presetName}" saved`);
                }
            }));

        // Apply preset
        if (Object.keys(this.plugin.settings.presets).length > 0) {
            new Setting(presetSection)
                .setName('Apply preset')
                .addDropdown(dropdown => {
                    Object.keys(this.plugin.settings.presets).forEach(preset => {
                        dropdown.addOption(preset, preset);
                    });
                    return dropdown.onChange(value => {
                        this.style = { ...this.plugin.settings.presets[value] };
                        this.updatePreview();
                    });
                });
        }

        // Apply button
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Apply changes')
                .setCta()
                .onClick(async () => {
                    await this.saveChanges();
                    this.close();
                }));
    }

    updatePreview() {
        if (this.style.backgroundColor) this.previewEl.style.backgroundColor = this.style.backgroundColor;
        if (this.style.textColor) this.previewEl.style.color = this.style.textColor;
        if (this.style.fontWeight) this.previewEl.style.fontWeight = this.style.fontWeight;
        if (this.style.fontStyle) this.previewEl.style.fontStyle = this.style.fontStyle;
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
        this.presetStyle = {};
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

        // Font weight
        new Setting(containerEl)
            .setName('Font weight')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'normal': 'Normal',
                    'bold': 'Bold'
                })
                .setValue(this.presetStyle.fontWeight || 'normal')
                .onChange(value => {
                    this.presetStyle.fontWeight = value;
                    this.updatePreview(previewEl);
                }));

        // Font style
        new Setting(containerEl)
            .setName('Font style')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'normal': 'Normal',
                    'italic': 'Italic'
                })
                .setValue(this.presetStyle.fontStyle || 'normal')
                .onChange(value => {
                    this.presetStyle.fontStyle = value;
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

        const presetNameInput = containerEl.createEl('input', {
            type: 'text',
            cls: 'preset-name-input',
            placeholder: 'Preset name'
        });

        new Setting(containerEl)
            .addButton(button => button
                .setButtonText('Save preset')
                .setCta()
                .onClick(async () => {
                    const presetName = presetNameInput.value;
                    if (presetName) {
                        if (this.plugin.settings.presets[presetName]) {
                            const shouldOverwrite = await this.plugin.confirmOverwritePreset(presetName);
                            if (!shouldOverwrite) return;
                        }
                        this.plugin.settings.presets[presetName] = { ...this.presetStyle };
                        await this.plugin.saveSettings();
                        presetNameInput.value = '';
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
                .setName(name)
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
        if (style.fontWeight) previewEl.style.fontWeight = style.fontWeight;
        if (style.fontStyle) previewEl.style.fontStyle = style.fontStyle;
        if (typeof style.opacity === 'number') previewEl.style.opacity = style.opacity.toString();
    }
}
