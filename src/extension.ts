'use strict';

import * as vscode from 'vscode';

import { DepNodeProvider, Dependency } from './nodeDependencies';
import { JsonOutlineProvider } from './jsonOutline';
import { FtpExplorer } from './ftpExplorer';
import { FileExplorer } from './fileExplorer';
import { TestView } from './testView';
import { DocumentSymbol } from 'vscode';
import { Location } from 'vscode';
import { Uri } from 'vscode';
import { read } from 'fs';



const URIS: Uri[] = [];

export async function activate(context: vscode.ExtensionContext) {
	getByExtension("ts");

	// Samples of `window.registerTreeDataProvider`
	const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('nodeDependencies.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
	vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	vscode.commands.registerCommand('nodeDependencies.deleteEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	const jsonOutlineProvider = new JsonOutlineProvider(context);
	vscode.window.registerTreeDataProvider('jsonOutline', jsonOutlineProvider);
	vscode.commands.registerCommand('jsonOutline.refresh', () => jsonOutlineProvider.refresh());
	vscode.commands.registerCommand('jsonOutline.refreshNode', offset => jsonOutlineProvider.refresh(offset));
	vscode.commands.registerCommand('jsonOutline.renameNode', offset => jsonOutlineProvider.rename(offset));
	vscode.commands.registerCommand('extension.openJsonSelection', range => jsonOutlineProvider.select(range));

	// Samples of `window.createView`
	new FtpExplorer(context);
	new FileExplorer(context);

	// Test View
	new TestView(context);
}

// recursion on files and directories
async function readDirectory(rootUri: Uri, regex: RegExp) {
	const entires = await vscode.workspace.fs.readDirectory(rootUri);

	entires.forEach(async entry => {
		const uri = Uri.joinPath(rootUri, '\\' + entry[0]);

		// the entry is a file w/ specified extension
		if (entry[1] == 1 && regex.test(entry[0])) {
			URIS.push(uri);
		}
		// the entry is a directory
		else {
			await readDirectory(uri, regex);
		}
	});

	console.log(URIS);
}

async function getByExtension(extension: string) {
	const folder = vscode.workspace.workspaceFolders[0];
	const regex = new RegExp('([a-zA-Z0-9s_\\.\\-():])+(.' + extension + ')$');

	await readDirectory(folder.uri, regex);

	console.log(URIS);
}

async function testGetReference() {

	const folder = vscode.workspace.workspaceFolders[0];
	const docs = await vscode.workspace.fs.readDirectory(folder.uri);

	const uri = Uri.joinPath(folder.uri, "/src/nodeDependencies.ts");
	const textDocument = await vscode.workspace.openTextDocument(uri);
	console.log(textDocument.getText());
	await new Promise(resolve => setTimeout(resolve, 1000));
	const symbols = await vscode.commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', uri);

	const locations = [];
	symbols.forEach(element => {
		getReferences(element, locations, uri);
	});

	console.log(symbols);

	// docs.forEach(element => {
	// 	if(element[1] == 1) {

	// 	}
	// });

}

async function getReferences(symbol: DocumentSymbol, locations: Location[], uri: Uri) {
	const position = symbol.range.start;
	const newLocations = await vscode.commands.executeCommand<Location[]>('vscode.executeReferenceProvider', uri, position);
	console.log(newLocations);
}

