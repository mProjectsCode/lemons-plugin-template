import { Editor, MarkdownFileInfo, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import { MyPluginSettings, DEFAULT_SETTINGS } from './settings/Settings';
import { SampleSettingTab } from './settings/SettingTab';

export default class MyPlugin extends Plugin {
	// @ts-ignore defined in on load;
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
