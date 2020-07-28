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

export async function activate(context: vscode.ExtensionContext) {
	//testGetReference();
	let testMap = createTestRefMap();
	let testDepMap = createDependencyMap(testMap);
	printMap(testDepMap);

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

// Test hashmap of doc names to their ref files
function createTestRefMap(){
	let referencesMap = new Map();
	const folder = vscode.workspace.workspaceFolders[0];
	referencesMap.set('file1', new Array<string>('a', 'b', 'c'))
	referencesMap.set('file2', new Array<string>('a', 'c', 'd', 'e'))
	referencesMap.set('file3', new Array<string>('b', 'd'))

	return referencesMap;
}

// Creates a map of the dependencies in each file
function createDependencyMap(symbolMap: Map<string, Array<string>>){
	let dependencyMap = new Map<string, Array<string>>();
	symbolMap.forEach((value: Array<string>, key: string) => {
		// Iterate over array of refs
		value.forEach(element => {
			if(dependencyMap.has(element)){
				dependencyMap.get(element).push(key);
			}
			else{
				dependencyMap.set(element, new Array<string>(key));
			}
		});
	});
	return dependencyMap;
}

// Test print maps
function printMap(map: Map<string, Array<string>>){
	map.forEach(element => {
		console.log(element)
	});
}

// Create TreeView
function createTreeView(){
	
}

