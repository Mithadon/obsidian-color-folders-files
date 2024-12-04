import { App, Modal, Setting, Notice, TextComponent, ColorComponent, ToggleComponent, SliderComponent } from 'obsidian';
import { StyleSettings, ColorFolderPluginInterface } from '../types';
import { DEFAULT_STYLE } from '../constants';

export class ColorSettingsModal extends Modal {
    private style: StyleSettings;
    private previewEl: HTMLElement;
    private styleEl: HTMLStyleElement;
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
        private filePath: string
    ) {
        super(app);
        this.style = { ...(plugin.settings.styles[filePath] || {}) };
    }

    onOpen() {
        this.modalEl.addClass('color-folders-files-modal');
        
        // Create style element for preview styles
        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
        
        const {contentEl} = this;
        contentEl.empty();

        // Preview section
        const previewSection = contentEl.createDiv('preview-section');
        this.previewEl = previewSection.createDiv('preview-item');
        this.previewEl.addClass('preview-style');
        const fileName = this.filePath.split('/').pop() || this.filePath;
        this.previewEl.createSpan().setText(fileName);
        this.updatePreview();

        // Background color with hex input
        const bgColorSetting = new Setting(contentEl).setName('Background color');
        const bgColorContainer = bgColorSetting.controlEl.createDiv('color-container');
        
        bgColorSetting.addColorPicker(color => {
            this.bgColorPicker = color;
            color.setValue(this.style.backgroundColor || '#ffffff')
                .onChange(value => {
                    this.style.backgroundColor = value;
                    bgHexInput.value = value;
                    this.updatePreview();
                });
        });

        const bgHexInput = bgColorContainer.createEl('input', {
            type: 'text',
            cls: 'color-hex-input',
            value: this.style.backgroundColor || '#ffffff'
        });
        bgHexInput.addEventListener('change', () => {
            const value = bgHexInput.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                this.style.backgroundColor = value;
                this.bgColorPicker.setValue(value);
                this.updatePreview();
            }
        });

        // Text color with hex input
        const textColorSetting = new Setting(contentEl).setName('Text color');
        const textColorContainer = textColorSetting.controlEl.createDiv('color-container');
        
        textColorSetting.addColorPicker(color => {
            this.textColorPicker = color;
            color.setValue(this.style.textColor || '#000000')
                .onChange(value => {
                    this.style.textColor = value;
                    textHexInput.value = value;
                    this.updatePreview();
                });
        });

        const textHexInput = textColorContainer.createEl('input', {
            type: 'text',
            cls: 'color-hex-input',
            value: this.style.textColor || '#000000'
        });
        textHexInput.addEventListener('change', () => {
            const value = textHexInput.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                this.style.textColor = value;
                this.textColorPicker.setValue(value);
                this.updatePreview();
            }
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
        
        const removeButton = buttonSection.createEl('button', {
            text: 'Remove styling'
        });
        removeButton.addEventListener('click', async () => {
            delete this.plugin.settings.styles[this.filePath];
            await this.plugin.saveSettings();
            new Notice('Styling removed');
            this.close();
        });

        const resetButton = buttonSection.createEl('button', {
            text: 'Reset'
        });
        resetButton.addEventListener('click', () => {
            this.style = { ...DEFAULT_STYLE };
            this.updateControls();
            this.updatePreview();
        });

        const applyButton = buttonSection.createEl('button', {
            text: 'Apply',
            cls: 'mod-cta'
        });
        applyButton.addEventListener('click', async () => {
            await this.saveChanges();
            new Notice('Changes applied');
            this.close();
        });

        const closeButton = buttonSection.createEl('button', {
            text: 'Close'
        });
        closeButton.addEventListener('click', () => {
            this.close();
        });
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
        // Reset classes
        this.previewEl.removeClass('is-bold', 'is-italic');
        
        // Add style classes based on current settings
        if (this.style.isBold) this.previewEl.addClass('is-bold');
        if (this.style.isItalic) this.previewEl.addClass('is-italic');

        // Update the style element with dynamic styles
        const css = `.preview-style {
            ${this.style.backgroundColor ? `background-color: ${this.style.backgroundColor};` : ''}
            ${this.style.textColor ? `color: ${this.style.textColor};` : ''}
            ${this.style.opacity !== undefined ? `opacity: ${this.style.opacity};` : ''}
        }`;
        this.styleEl.textContent = css;
    }

    async saveChanges() {
        this.plugin.settings.styles[this.filePath] = this.style;
        await this.plugin.saveSettings();
    }

    onClose() {
        // Clean up the style element
        if (this.styleEl && this.styleEl.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
        }
        this.modalEl.removeClass('color-folders-files-modal');
        const {contentEl} = this;
        contentEl.empty();
    }
}
