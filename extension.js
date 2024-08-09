const vscode = require('vscode');

let methods = [];

const flattenSymbols = (symbols) => {
	let result = [];
	for (const symbol of symbols) {
		result.push(symbol);
		if (symbol.children) {
			result = result.concat(flattenSymbols(symbol.children));
		}
	}
	return result;
};

const updateMethodsCache = async (document) => {
	const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
	if (!symbols) {
		methods = [];
		return;
	}
	// TODO: implement per language logic
	methods = flattenSymbols(symbols)
		.filter(symbol => symbol.kind === vscode.SymbolKind.Method)
		.sort((a, b) => a.selectionRange.start.compareTo(b.selectionRange.start));
};

const findNextMethodIndex = (position) => {
	let start = 0;
	let end = methods.length - 1;
	// binary search's boiler plate makes it not worth it, but it is fancy
	while (start <= end) {
		const mid = Math.floor((start + end) / 2);
		// Using selectionRange sounds hacky but jumps through comments and docs
		const methodPosition = methods[mid].selectionRange.start;
		if (methodPosition.isAfter(position)) {
			end = mid - 1;
		} else {
			start = mid + 1;
		}
	}
	return start;
};

const getMethod = (direction) => {
	return async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No editor is active');
			return;
		}
		const document = editor.document;
		const position = editor.selection.active;
		if (!position) {
			vscode.window.showInformationMessage('No cursor position found');
			return;
		}
		if (methods.length === 0) {
			await updateMethodsCache(document);
		}
		const methodIndex = findNextMethodIndex(position);
		let targetMethod = null;
		if (direction === 'next') {
			if (methodIndex < methods.length) {
				targetMethod = methods[methodIndex];
			}
		} else if (direction === 'previous') {
			if (methodIndex > 0) {
				targetMethod = methods[methodIndex - 1].selectionRange.start.isEqual(position)
					? methods[methodIndex - 2]
					: methods[methodIndex - 1];
			}
		}
		if (targetMethod) {
			editor.selection = new vscode.Selection(targetMethod.selectionRange.start, targetMethod.selectionRange.start);
			editor.revealRange(targetMethod.selectionRange);
		} else {
			vscode.window.showInformationMessage('No method found');
		}
	};
};

async function jumpToNext() {
	await getMethod('next')();
}

async function jumpToPrevious() {
	await getMethod('previous')();
}

function activate(context) {
	const disposablePrevious = vscode.commands.registerCommand('java-jump-to-method.jumpToPrevious', jumpToPrevious);
	context.subscriptions.push(disposablePrevious);
	const disposableNext = vscode.commands.registerCommand('java-jump-to-method.jumpToNext', jumpToNext);
	context.subscriptions.push(disposableNext);
	vscode.workspace.onDidChangeTextDocument(
		event => {
			if (event.document) {
				updateMethodsCache(event.document);
			}
		}
	);
	vscode.window.onDidChangeActiveTextEditor(
		editor => {
			if (editor) {
				updateMethodsCache(editor.document);
			}
		}
	);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
