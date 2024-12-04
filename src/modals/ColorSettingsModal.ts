import { App, Modal, Setting, Notice, TextComponent, ColorComponent, ToggleComponent, SliderComponent } from 'obsidian';
import { StyleSettings, ColorFolderPluginInterface } from '../types';
import { DEFAULT_STYLE } from '../constants';

export class ColorSettingsModal extends Modal {
    private style: StyleSettings;
    private previewEl: HTMLElement;
    // Store control references
    private bgColorPicker: ColorComponent;
    private textColorPicker: ColorComponent;
    private boldToggle: ToggleComponent;
    private italicToggle: ToggleComponent;
    private opacitySlider: SliderComponent;
    private subfolderToggle: ToggleComponent;
    private filesToggle: ToggleComponent;

    constructor(
        app: App,
        private plugin: ColorFolderPluginInterface,
        private file: any
    ) {
        super(app);
        this.style = { ...(plugin.settings.styles[file.path] || {}) };
    }

    onOpen() {
        this.modalEl.addClass('color-folders-files-modal');
        
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

        // Preset section
        if (Object.keys(this.plugin.settings.presets).length > 0) {
            new Setting(contentEl)
                .setName('Apply preset')
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

        // Save as preset section
        let presetNameInput: TextComponent;
        const presetSetting = new Setting(contentEl)
            .setClass('preset-save')
            .setName('Save as preset')
            .addText(text => {
                presetNameInput = text;
                text.setPlaceholder('Preset name');
            })
            .addButton(button => button
                .setButtonText('Save')
                .setCta()
                .onClick(async () => {
                    const presetName = presetNameInput.getValue();
                    if (presetName) {
                        if (this.plugin.settings.presets[presetName]) {
                            const shouldOverwrite = await this.plugin.confirmOverwritePreset(presetName);
                            if (!shouldOverwrite) return;
                        }
                        this.plugin.settings.presets[presetName] = { ...this.style };
                        await this.plugin.saveSettings();
                        presetNameInput.setValue('');
                        new Notice(`Preset "${presetName}" saved`);
                        // Refresh the modal to show the new preset
                        this.onOpen();
                    }
                }));

        // Buttons section
        const buttonSection = contentEl.createDiv('button-section');
        
        new Setting(buttonSection)
            .addButton(button => button
                .setButtonText('Reset')
                .onClick(() => {
                    this.style = { ...DEFAULT_STYLE };
                    this.updateControls();
                    this.updatePreview();
                }))
            .addButton(button => button
                .setButtonText('Apply')
                .setCta()
                .onClick(async () => {
                    await this.saveChanges();
                    new Notice('Changes applied');
                }))
            .addButton(button => button
                .setButtonText('Close')
                .onClick(() => {
                    this.close();
                }));
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
        this.modalEl.removeClass('color-folders-files-modal');
        const {contentEl} = this;
        contentEl.empty();
    }
}
