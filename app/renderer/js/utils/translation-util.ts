'use strict';

import path from 'path';
import electron from 'electron';
import i18n from 'i18n';

let app: Electron.App = null;

/* To make the util runnable in both main and renderer process */
if (process.type === 'renderer') {
	app = electron.remote.app;
} else {
	app = electron.app;
}

i18n.configure({
	directory: path.join(__dirname, '../../../translations/')
});

export function __(phrase: string): string {
	return i18n.__({ phrase, locale: app.getLocale() ? app.getLocale() : 'en' });
}
