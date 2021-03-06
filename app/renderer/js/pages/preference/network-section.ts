'use strict';

import { ipcRenderer } from 'electron';

import BaseSection from './base-section';
import * as ConfigUtil from '../../utils/config-util';
import * as t from '../../utils/translation-util';

export default class NetworkSection extends BaseSection {
	// TODO: TypeScript - Here props should be object type
	props: any;
	$proxyPAC: HTMLInputElement;
	$proxyRules: HTMLInputElement;
	$proxyBypass: HTMLInputElement;
	$proxySaveAction: Element;
	$manualProxyBlock: Element;
	constructor(props: any) {
		super();
		this.props = props;
	}

	template(): string {
		return `
            <div class="settings-pane">
                <div class="title">${t.__('Proxy')}</div>
                <div id="appearance-option-settings" class="settings-card">
					<div class="setting-row" id="use-system-settings">
						<div class="setting-description">${t.__('Use system proxy settings (requires restart)')}</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="use-manual-settings">
						<div class="setting-description">${t.__('Manual proxy configuration')}</div>
						<div class="setting-control"></div>
					</div>
					<div class="manual-proxy-block">
						<div class="setting-row" id="proxy-pac-option">
							<span class="setting-input-key">PAC ${t.__('script')}</span>
							<input class="setting-input-value" placeholder="e.g. foobar.com/pacfile.js"/>
						</div>
						<div class="setting-row" id="proxy-rules-option">
							<span class="setting-input-key">${t.__('Proxy rules')}</span>
							<input class="setting-input-value" placeholder="e.g. http=foopy:80;ftp=foopy2"/>
						</div>
						<div class="setting-row" id="proxy-bypass-option">
							<span class="setting-input-key">${t.__('Proxy bypass rules')}</span>
							<input class="setting-input-value" placeholder="e.g. foobar.com"/>
						</div>
						<div class="setting-row">
							<div class="action green" id="proxy-save-action">
								<span>${t.__('Save')}</span>
							</div>
						</div>
					</div>
				</div>
            </div>
		`;
	}

	init(): void {
		this.props.$root.innerHTML = this.template();
		this.$proxyPAC = document.querySelector('#proxy-pac-option .setting-input-value');
		this.$proxyRules = document.querySelector('#proxy-rules-option .setting-input-value');
		this.$proxyBypass = document.querySelector('#proxy-bypass-option .setting-input-value');
		this.$proxySaveAction = document.querySelector('#proxy-save-action');
		this.$manualProxyBlock = this.props.$root.querySelector('.manual-proxy-block');
		this.initProxyOption();

		this.$proxyPAC.value = ConfigUtil.getConfigItem('proxyPAC', '');
		this.$proxyRules.value = ConfigUtil.getConfigItem('proxyRules', '');
		this.$proxyBypass.value = ConfigUtil.getConfigItem('proxyBypass', '');

		this.$proxySaveAction.addEventListener('click', () => {
			ConfigUtil.setConfigItem('proxyPAC', this.$proxyPAC.value);
			ConfigUtil.setConfigItem('proxyRules', this.$proxyRules.value);
			ConfigUtil.setConfigItem('proxyBypass', this.$proxyBypass.value);

			ipcRenderer.send('forward-message', 'reload-proxy', true);
		});
	}

	initProxyOption(): void {
		const manualProxyEnabled = ConfigUtil.getConfigItem('useManualProxy', false);
		this.toggleManualProxySettings(manualProxyEnabled);

		this.updateProxyOption();
	}

	toggleManualProxySettings(option: boolean): void {
		if (option) {
			this.$manualProxyBlock.classList.remove('hidden');
		} else {
			this.$manualProxyBlock.classList.add('hidden');
		}
	}

	updateProxyOption(): void {
		this.generateSettingOption({
			$element: document.querySelector('#use-system-settings .setting-control'),
			value: ConfigUtil.getConfigItem('useSystemProxy', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('useSystemProxy');
				const manualProxyValue = ConfigUtil.getConfigItem('useManualProxy');
				if (manualProxyValue && newValue) {
					ConfigUtil.setConfigItem('useManualProxy', !manualProxyValue);
					this.toggleManualProxySettings(!manualProxyValue);
				}
				if (!newValue) {
					// Remove proxy system proxy settings
					ConfigUtil.setConfigItem('proxyRules', '');
					ipcRenderer.send('forward-message', 'reload-proxy', false);
				}
				ConfigUtil.setConfigItem('useSystemProxy', newValue);
				this.updateProxyOption();
			}
		});
		this.generateSettingOption({
			$element: document.querySelector('#use-manual-settings .setting-control'),
			value: ConfigUtil.getConfigItem('useManualProxy', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('useManualProxy');
				const systemProxyValue = ConfigUtil.getConfigItem('useSystemProxy');
				this.toggleManualProxySettings(newValue);
				if (systemProxyValue && newValue) {
					ConfigUtil.setConfigItem('useSystemProxy', !systemProxyValue);
				}
				ConfigUtil.setConfigItem('proxyRules', '');
				ConfigUtil.setConfigItem('useManualProxy', newValue);
				// Reload app only when turning manual proxy off, hence !newValue
				ipcRenderer.send('forward-message', 'reload-proxy', !newValue);
				this.updateProxyOption();
			}
		});
	}
}
