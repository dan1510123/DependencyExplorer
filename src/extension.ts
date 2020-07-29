'use strict';

import * as vscode from 'vscode';

import { TreeExplorerProvider } from './nodeDependencies';

export async function activate() {
	// Samples of `window.registerTreeDataProvider`
	const nodeDependenciesProvider = new TreeExplorerProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
}
