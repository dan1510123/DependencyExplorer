import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider, TreeItem } from 'vscode'
import { Uri } from 'vscode';
import { DocumentSymbol } from 'vscode';
import { Location } from 'vscode';

export class TreeExplorerProvider implements TreeDataProvider<TreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;
	private referenceMap = new Map<string, Set<string>>();
	private dependencyMap = new Map<string, Set<string>>();
	private URIS: Uri[] = [];
	private doneCollectingInfo: boolean = false;

	constructor(private workspaceRoot: string) {
		this.getByExtension("ts").then(() => {
			this.populateHashMap(this.URIS).then(() => {
				this.createDependencyMap(this.referenceMap);
			})
				.then(() => {
					this.doneCollectingInfo = true;
					this.refresh();
				})
		})
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No information for empty workspace');
			return Promise.resolve([]);
		}

		if (element) {
			if (element instanceof FileItem) {
				return Promise.resolve([]);
			}
			else if (element instanceof DependenciesItem) {

			}
			else if (element instanceof ReferencesItem) {

			}
		}
		else {
			return Promise.resolve(this.getTopLevelFiles());
		}
	}

	getTopLevelFiles(): TreeItem[] {
		if (this.doneCollectingInfo) {
			var fileitems: FileItem[] = [];
			for (let entry of this.referenceMap.entries()) {
				fileitems.push(new FileItem(entry[0], vscode.TreeItemCollapsibleState.Collapsed))
			}
			return fileitems;
		}
		else {
			return [new TreeItem("Please wait for the tree to load...", vscode.TreeItemCollapsibleState.None)]
		}
	}

	// recursion on files and directories
	async readDirectory(rootUri: Uri, regex: RegExp) {
		const entires = await vscode.workspace.fs.readDirectory(rootUri);

		entires.forEach(async entry => {
			const uri = Uri.joinPath(rootUri, '/' + entry[0]);

			// the entry is a file w/ specified extension
			if (entry[1] == 1) {
				if (regex.test(entry[0])) {
					this.URIS.push(uri);
				}
			}
			// the entry is a directory
			else if (uri.fsPath.search('node_modules') == -1) {
				await this.readDirectory(uri, regex);
			}
		});
	}

	async getByExtension(extension: string) {
		const folder = vscode.workspace.workspaceFolders[0];
		const regex = new RegExp('([a-zA-Z0-9s_\\.\\-():])+(.' + extension + ')$');

		await this.readDirectory(folder.uri, regex);
	}

	async populateHashMap(uris: Uri[]) {
		console.log("Pausing first");
		await new Promise(resolve => setTimeout(resolve, 1000));
		console.log("Starting to get symbols and references");

		for (let i = 0; i < uris.length; i++) {
			const uri = uris[i];
			const symbols = await vscode.commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', uri);

			for (let j = 0; j < symbols.length; j++) {
				const symbol = symbols[j];
				const locations = await vscode.commands.executeCommand<Location[]>('vscode.executeReferenceProvider', uri, symbol.range.start);
				this.getReferences(locations, uri);
			}
		}

		console.log("Printing referenceMap:");

		for (const entry of this.referenceMap.entries()) {
			console.log("Key:", entry[0]);
			entry[1].forEach(element => {
				console.log(element);
			});
		}
		console.log(this.URIS);
	}

	getReferences(locations: Location[], uri: Uri) {
		locations.forEach(location => {
			const original = uri.path.toLowerCase();
			const reference = location.uri.path.toLowerCase();
			if (!this.referenceMap.has(original)) {
				this.referenceMap.set(original, new Set<string>());
			}
			if (original !== reference && reference.search('node_module') == -1) {
				this.referenceMap.get(original).add(reference);
			}
		});
	}

	// Creates a map of the dependencies in each file
	createDependencyMap(referenceMap: Map<string, Set<string>>) {
		for (let entry of referenceMap.entries()) {
			if (entry[1].size != 0) {
				entry[1].forEach(element => {
					if (this.dependencyMap.has(element)) {
						let referenceSet = this.dependencyMap.get(element);
						referenceSet.add(entry[0]);
					}
					else {
						let set = new Set<string>();
						set.add(entry[0]);
						this.dependencyMap.set(element, set);
					}
				});
			}
		}
		for (let entry of this.dependencyMap.entries()) {
			console.log("Key:", entry[0]);
			entry[1].forEach(element => {
				console.log("Value:")
				console.log(element)
			});
		}
	}
}

export class FileItem extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `${this.label}`;
	}

	get description(): string {
		return this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
	};

	contextValue = 'file';

}

export class DependenciesItem extends TreeItem {
	public targetFile: string;

	constructor(
		targetFile: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super("Dependencies", collapsibleState);
		this.targetFile = targetFile;
	}

	get tooltip(): string {
		return `${this.label}`;
	}

	get description(): string {
		return this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';

}

export class ReferencesItem extends TreeItem {
	public targetFile: string;

	constructor(
		targetFile: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super("References", collapsibleState);
		this.targetFile = targetFile;
	}

	get tooltip(): string {
		return `${this.label}`;
	}

	get description(): string {
		return this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'reference';

}
