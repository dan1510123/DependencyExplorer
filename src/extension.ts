'use strict';

import * as vscode from 'vscode';

import { DepNodeProvider, Dependency } from './nodeDependencies';
import { JsonOutlineProvider } from './jsonOutline';
import { FtpExplorer } from './ftpExplorer';
import { FileExplorer } from './fileExplorer';
import { TestView } from './testView';
import { DocumentSymbol } from 'vscode';
import { Location } from 'vscode';
import { Position } from 'vscode';
import { Uri } from 'vscode';

let referenceMap = new Map<String, Set<String>>();

export async function activate(context: vscode.ExtensionContext) {
	var folder = vscode.workspace.workspaceFolders[0]
	let uri = Uri.joinPath(folder.uri, "/src/nodeDependencies.ts")
	let uris = [uri]
	populateHashMap(uris);

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

async function populateHashMap(uris: Uri[]) {
	console.log("Pausing first");
	await new Promise(resolve => setTimeout(resolve, 1000));
	console.log("Starting to get symbols and references")

	for(var i = 0; i < uris.length; i++) {
		let uri = uris[i]
		let symbols = await vscode.commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', uri)
		
		for(var j = 0; j < symbols.length; j++) {
			const symbol = symbols[j]
			const locations = await vscode.commands.executeCommand<Location[]>('vscode.executeReferenceProvider', uri, symbol.range.start)
			getReferences(locations, uri);
		}
	}

	console.log("Printing referenceMap:")
	
	for (let entry of referenceMap.entries()) {
		console.log("Key:", entry[0]);
		entry[1].forEach(element => {
			console.log(element)
		});
	}
}

async function getReferences(locations: Location[], uri: Uri) {
	locations.forEach(location => {
		let original = uri.path
		let reference = location.uri.path;
		if(!referenceMap.has(original) && original != reference) {
			referenceMap.set(original, new Set<String>());
		}
		referenceMap.get(original).add(reference)
	});
}