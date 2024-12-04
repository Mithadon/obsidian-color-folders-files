import { App, PluginSettingTab, Setting, Notice, TextComponent } from 'obsidian';
import { StyleSettings, ColorFolderPluginInterface } from '../types';
import { DEFAULT_STYLE } from '../constants';

export class ColorSettingsTab extends PluginSettingTab {
    private presetStyle: StyleSettings;

    constructor(app: App, private plugin: ColorFolderPluginInterface) {
        super(app, plugin as any);
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
