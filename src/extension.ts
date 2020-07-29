'use strict';

import * as vscode from 'vscode';

import { TreeExplorerProvider } from './nodeDependencies';
import { JsonOutlineProvider } from './jsonOutline';
import { FtpExplorer } from './ftpExplorer';
import { FileExplorer } from './fileExplorer';
import { TestView } from './testView';
import { DocumentSymbol } from 'vscode';
import { Location } from 'vscode';
import { Uri } from 'vscode';
import { read } from 'fs';

export async function activate(context: vscode.ExtensionContext) {
	// Samples of `window.registerTreeDataProvider`
	const nodeDependenciesProvider = new TreeExplorerProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
}
