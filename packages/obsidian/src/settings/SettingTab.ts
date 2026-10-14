import type { App, SettingDefinitionItem } from 'obsidian';
import { PluginSettingTab } from 'obsidian';
import type MyPlugin from 'packages/obsidian/src/main';

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);

		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Setting #1',
				desc: "It's a secret",
				control: { type: 'text', key: 'mySetting', placeholder: 'Enter your secret' },
			},
		];
	}
}
