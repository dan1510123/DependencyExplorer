import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {TreeDataProvider, TreeItem} from 'vscode'

export class TreeExplorerProvider implements TreeDataProvider<TreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
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
			return Promise.resolve([]);
		}
		else {
			return Promise.resolve([new Dependency(vscode.TreeItemCollapsibleState.Collapsed)]);
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

export class Dependency extends TreeItem {
	
	

	constructor(
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super("Dependencies", collapsibleState);
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

export class Reference extends TreeItem {

	constructor(
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super("reference", collapsibleState);
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
