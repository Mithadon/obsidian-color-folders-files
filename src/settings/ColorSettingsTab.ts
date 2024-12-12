import { App, Plugin, PluginSettingTab, Setting, Notice, TextComponent, ColorComponent } from 'obsidian';
import { StyleSettings, ColorFolderPluginInterface } from '../types';
import { DEFAULT_STYLE } from '../constants';

export class ColorSettingsTab extends PluginSettingTab {
    private presetStyle: StyleSettings;
    private plugin: ColorFolderPluginInterface;
    private styleEl: HTMLStyleElement;

    constructor(app: App, plugin: Plugin & ColorFolderPluginInterface) {
        super(app, plugin);
        this.plugin = plugin;
        this.resetPresetStyle();
        this.syncPresetOrder();
    }

    private syncPresetOrder() {
        // Get all preset names
        const allPresets = Object.keys(this.plugin.settings.presets);
        
        // Initialize presetOrder if it doesn't exist
        if (!this.plugin.settings.presetOrder) {
            this.plugin.settings.presetOrder = [];
        }

        // Add any missing presets to the order
        allPresets.forEach(presetName => {
            if (!this.plugin.settings.presetOrder.includes(presetName)) {
                this.plugin.settings.presetOrder.push(presetName);
            }
        });

        // Remove any presets from the order that no longer exist
        this.plugin.settings.presetOrder = this.plugin.settings.presetOrder.filter(
            name => allPresets.includes(name)
        );

        this.plugin.saveSettings();
    }

    resetPresetStyle() {
        this.presetStyle = { ...DEFAULT_STYLE };
    }

    hide() {
        // Clean up style element when tab is hidden
        if (this.styleEl) {
            this.styleEl.remove();
        }
        super.hide();
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        // Remove old style element if it exists
        if (this.styleEl) {
            this.styleEl.remove();
        }

        // Create new style element for hover states
        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);

        // Ensure presetOrder is synced before displaying
        this.syncPresetOrder();

        // Create new preset section
        new Setting(containerEl).setHeading().setName('Create new preset');
        
        const previewEl = containerEl.createDiv('preview-item');
        previewEl.setAttribute('data-path', 'new-preset-preview');
        previewEl.createSpan().setText('Preview');
        this.updatePreview(previewEl);

        // Preset selector
        if (Object.keys(this.plugin.settings.presets).length > 0) {
            new Setting(containerEl)
                .setName('Start from preset')
                .setDesc('Select an existing preset as a starting point')
                .addDropdown(dropdown => {
                    dropdown.addOption('', 'Select a preset...');
                    Object.keys(this.plugin.settings.presets).forEach(preset => {
                        dropdown.addOption(preset, preset);
                    });
                    return dropdown.onChange(value => {
                        if (value) {
                            this.presetStyle = { ...this.plugin.settings.presets[value] };
                            this.updatePreview(previewEl);
                            // Update all controls
                            if (this.bgColorPicker) this.bgColorPicker.setValue(this.presetStyle.backgroundColor || '#ffffff');
                            if (this.textColorPicker) this.textColorPicker.setValue(this.presetStyle.textColor || '#000000');
                            if (this.boldToggle) this.boldToggle.setValue(this.presetStyle.isBold || false);
                            if (this.italicToggle) this.italicToggle.setValue(this.presetStyle.isItalic || false);
                            if (this.opacitySlider) this.opacitySlider.setValue(this.presetStyle.opacity || 1);
                            // Reset dropdown after selection
                            dropdown.setValue('');
                        }
                    });
                });
        }
        
        // Background color with hex input
        const bgColorSetting = new Setting(containerEl).setName('Background color');
        const bgColorContainer = bgColorSetting.controlEl.createDiv('color-container');
        
        let bgHexInput: HTMLInputElement;
        let bgColorPicker: ColorComponent;
        bgColorSetting.addColorPicker(color => {
            bgColorPicker = color;
            this.bgColorPicker = color;
            color.setValue(this.presetStyle.backgroundColor || '#ffffff')
                .onChange(value => {
                    this.presetStyle.backgroundColor = value;
                    bgHexInput.value = value;
                    this.updatePreview(previewEl);
                });
        });

        bgHexInput = bgColorContainer.createEl('input', {
            type: 'text',
            cls: 'color-hex-input',
            value: this.presetStyle.backgroundColor || '#ffffff'
        });
        bgHexInput.addEventListener('change', () => {
            const value = bgHexInput.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                this.presetStyle.backgroundColor = value;
                bgColorPicker.setValue(value);
                this.updatePreview(previewEl);
            }
        });

        // Text color with hex input
        const textColorSetting = new Setting(containerEl).setName('Text color');
        const textColorContainer = textColorSetting.controlEl.createDiv('color-container');
        
        let textHexInput: HTMLInputElement;
        let textColorPicker: ColorComponent;
        textColorSetting.addColorPicker(color => {
            textColorPicker = color;
            this.textColorPicker = color;
            color.setValue(this.presetStyle.textColor || '#000000')
                .onChange(value => {
                    this.presetStyle.textColor = value;
                    textHexInput.value = value;
                    this.updatePreview(previewEl);
                });
        });

        textHexInput = textColorContainer.createEl('input', {
            type: 'text',
            cls: 'color-hex-input',
            value: this.presetStyle.textColor || '#000000'
        });
        textHexInput.addEventListener('change', () => {
            const value = textHexInput.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                this.presetStyle.textColor = value;
                textColorPicker.setValue(value);
                this.updatePreview(previewEl);
            }
        });

        // Bold toggle
        let boldToggle: any;
        new Setting(containerEl)
            .setName('Bold')
            .addToggle(toggle => {
                boldToggle = toggle;
                this.boldToggle = toggle;
                toggle.setValue(this.presetStyle.isBold || false)
                    .onChange(value => {
                        this.presetStyle.isBold = value;
                        this.updatePreview(previewEl);
                    });
            });

        // Italic toggle
        let italicToggle: any;
        new Setting(containerEl)
            .setName('Italic')
            .addToggle(toggle => {
                italicToggle = toggle;
                this.italicToggle = toggle;
                toggle.setValue(this.presetStyle.isItalic || false)
                    .onChange(value => {
                        this.presetStyle.isItalic = value;
                        this.updatePreview(previewEl);
                    });
            });

        // Opacity
        let opacitySlider: any;
        new Setting(containerEl)
            .setName('Opacity')
            .addSlider(slider => {
                opacitySlider = slider;
                this.opacitySlider = slider;
                slider.setLimits(0, 1, 0.1)
                    .setValue(this.presetStyle.opacity || 1)
                    .onChange(value => {
                        this.presetStyle.opacity = value;
                        this.updatePreview(previewEl);
                    });
            });

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
                    this.updatePreview(previewEl);
                    // Update all controls
                    bgColorPicker.setValue(this.presetStyle.backgroundColor || '#ffffff');
                    textColorPicker.setValue(this.presetStyle.textColor || '#000000');
                    boldToggle.setValue(this.presetStyle.isBold || false);
                    italicToggle.setValue(this.presetStyle.isItalic || false);
                    opacitySlider.setValue(this.presetStyle.opacity || 1);
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
                        if (!this.plugin.settings.presetOrder.includes(presetName)) {
                            this.plugin.settings.presetOrder.push(presetName);
                        }
                        await this.plugin.saveSettings();
                        textComponent.setValue('');
                        this.display();
                        new Notice(`Preset "${presetName}" saved`);
                    }
                }));

        // Existing presets section
        new Setting(containerEl).setHeading().setName('Existing presets');
        
        const presetsContainer = containerEl.createDiv('presets-container');

        // Create preset elements in order
        this.plugin.settings.presetOrder.forEach((name) => {
            const preset = this.plugin.settings.presets[name];
            if (!preset) return; // Skip if preset was deleted

            const presetContainer = presetsContainer.createDiv('preset-container');
            presetContainer.setAttribute('draggable', 'true');
            presetContainer.dataset.presetName = name;
            
            // Handle drag events
            presetContainer.addEventListener('dragstart', (e: DragEvent) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', name);
                    presetContainer.addClass('dragging');
                }
            });

            presetContainer.addEventListener('dragend', () => {
                presetContainer.removeClass('dragging');
            });

            presetContainer.addEventListener('dragover', (e: DragEvent) => {
                e.preventDefault();
                const dragging = presetsContainer.querySelector('.dragging');
                if (!dragging) return;
                
                const siblings = Array.from(presetsContainer.querySelectorAll('.preset-container:not(.dragging)'));
                const nextSibling = siblings.find(sibling => {
                    const rect = sibling.getBoundingClientRect();
                    const offset = e.clientY - rect.top - rect.height / 2;
                    return offset < 0;
                });

                if (nextSibling) {
                    presetsContainer.insertBefore(dragging, nextSibling);
                } else {
                    presetsContainer.appendChild(dragging);
                }
            });

            presetContainer.addEventListener('drop', async (e: DragEvent) => {
                e.preventDefault();
                if (e.dataTransfer) {
                    const containers = Array.from(presetsContainer.querySelectorAll('.preset-container')) as HTMLElement[];
                    const newOrder = containers.map(container => container.dataset.presetName).filter((name): name is string => name !== undefined);
                    
                    this.plugin.settings.presetOrder = newOrder;
                    await this.plugin.saveSettings();
                }
            });
            
            const previewEl = presetContainer.createDiv('preview-item');
            previewEl.setAttribute('data-path', `preset-${name}`);
            previewEl.createSpan().setText(name);
            this.updatePreview(previewEl, preset);

            const dragHandle = presetContainer.createDiv('drag-handle');
            const handleIcon = dragHandle.createSpan();
            handleIcon.setText('⋮⋮');

            new Setting(presetContainer)
                .addButton(btn => btn
                    .setIcon('trash')
                    .setTooltip('Delete preset')
                    .onClick(async () => {
                        delete this.plugin.settings.presets[name];
                        this.plugin.settings.presetOrder = this.plugin.settings.presetOrder.filter(n => n !== name);
                        await this.plugin.saveSettings();
                        this.display();
                        new Notice(`Preset "${name}" deleted`);
                    }));
        });

        // Import/Export section
        new Setting(containerEl).setHeading().setName('Import/export');
        
        const importExportContainer = containerEl.createDiv('settings-import-export');
        
        // Import button
        const importButton = importExportContainer.createEl('button', {
            text: 'Import'
        });
        importButton.addEventListener('click', async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async () => {
                const file = input.files?.[0];
                if (file) {
                    try {
                        const text = await file.text();
                        const settings = JSON.parse(text);
                        
                        // Validate settings structure
                        if (settings && 
                            typeof settings === 'object' && 
                            'styles' in settings && 
                            'presets' in settings) {
                            this.plugin.settings = settings;
                            // Sync presetOrder with imported settings
                            this.syncPresetOrder();
                            await this.plugin.saveSettings();
                            this.display();
                            new Notice('Settings imported successfully');
                        } else {
                            new Notice('Invalid settings file format');
                        }
                    } catch (e) {
                        console.error('Error importing settings:', e);
                        new Notice('Error importing settings');
                    }
                }
            };
            
            input.click();
        });

        // Export button
        const exportButton = importExportContainer.createEl('button', {
            text: 'Export'
        });
        exportButton.addEventListener('click', () => {
            const settingsJson = JSON.stringify(this.plugin.settings, null, 2);
            const blob = new Blob([settingsJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `color-folders-files-settings-v${this.plugin.manifest.version}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        });
    }

    private updatePreview(previewEl: HTMLElement, style: StyleSettings = this.presetStyle) {
        const path = previewEl.getAttribute('data-path');
        if (!path || !style) return;

        // Update base styles
        if (style.backgroundColor) {
            previewEl.style.backgroundColor = style.backgroundColor;
            previewEl.style.transition = 'background-color 0.1s ease';
        }
        if (style.textColor) {
            previewEl.style.color = style.textColor;
        }
        if (style.isBold) {
            previewEl.style.fontWeight = 'bold';
        }
        if (style.isItalic) {
            previewEl.style.fontStyle = 'italic';
        }
        if (typeof style.opacity === 'number') {
            previewEl.style.opacity = String(style.opacity);
        }

        // Update hover styles
        if (style.backgroundColor) {
            const rules = `
                /* Light mode: lighten on hover */
                body.theme-light .preview-item[data-path="${path}"]:hover {
                    background-color: color-mix(in srgb, white 20%, ${style.backgroundColor}) !important;
                    ${typeof style.opacity === 'number' ? `opacity: ${Math.min(1, style.opacity + 0.15)} !important;` : ''}
                }

                /* Dark mode: darken on hover */
                body.theme-dark .preview-item[data-path="${path}"]:hover {
                    background-color: color-mix(in srgb, black 20%, ${style.backgroundColor}) !important;
                    ${typeof style.opacity === 'number' ? `opacity: ${Math.min(1, style.opacity + 0.15)} !important;` : ''}
                }
            `;

            // Append to style element
            this.styleEl.textContent += rules;
        }
    }

    // Properties for control references
    private bgColorPicker: ColorComponent;
    private textColorPicker: ColorComponent;
    private boldToggle: any;
    private italicToggle: any;
    private opacitySlider: any;
}

