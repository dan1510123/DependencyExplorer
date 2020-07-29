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

const referenceMap = new Map<String, Set<String>>();
const URIS: Uri[] = [];

export async function activate(context: vscode.ExtensionContext) {
	getByExtension("ts").then((success) => {
		populateHashMap(URIS).then((success) => {
			createDependencyMap(referenceMap);
		});
	});
	

	var folder = vscode.workspace.workspaceFolders[0]
	let uri1 = Uri.joinPath(folder.uri, "/src/nodeDependencies.ts")
	let uri2 = Uri.joinPath(folder.uri, "/src/fileExplorer.ts")
	let uri3 = Uri.joinPath(folder.uri, "/src/ftpExplorer.ts")
	let uri4 = Uri.joinPath(folder.uri, "/src/extension.ts")
	let uri5 = Uri.joinPath(folder.uri, "/src/jsonOutline.ts")
	let uris = [uri1, uri2, uri3, uri4, uri5]

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
		const uri = Uri.joinPath(rootUri, '/' + entry[0]);

		// the entry is a file w/ specified extension
		if (entry[1] == 1) {
			if(regex.test(entry[0])) {
				URIS.push(uri);
			}
		}
		// the entry is a directory
		else if(uri.fsPath.search('node_modules') == -1) {
			await readDirectory(uri, regex);
		}
	});
}

async function getByExtension(extension: string) {
	const folder = vscode.workspace.workspaceFolders[0];
	const regex = new RegExp('([a-zA-Z0-9s_\\.\\-():])+(.' + extension + ')$');

	await readDirectory(folder.uri, regex);
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
	console.log(URIS)
}

async function getReferences(locations: Location[], uri: Uri) {
	locations.forEach(location => {
		let original = uri.path.toLowerCase();
		let reference = location.uri.path.toLowerCase();
		if(!referenceMap.has(original)) {
			referenceMap.set(original, new Set<String>());
		}
		if(original !== reference && reference.search('node_module') == -1) {
			referenceMap.get(original).add(reference)
		}
	});
}

// Creates a map of the dependencies in each file
function createDependencyMap(referenceMap: Map<String, Set<String>>) {
	let dependencyMap = new Map<String, Set<String>>();
    for (let entry of referenceMap.entries()) {
		if(entry[1].size != 0){
			entry[1].forEach(element => {
				if(dependencyMap.has(element)){
					let referenceSet = dependencyMap.get(element);
					referenceSet.add(entry[0]);
				}
				else{
					let set = new Set<String>();
					set.add(entry[0]);
					dependencyMap.set(element, set);
				}
			});
		}
	}
	for (let entry of dependencyMap.entries()) {
		console.log("Key:", entry[0]);
		entry[1].forEach(element => {
			console.log("Value:")
			console.log(element)
		});
	}
}