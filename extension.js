const vscode = require('vscode');

let functions = [];
let isCacheValid = false;

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

const updateFunctionsCache = async (document) => {
	const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
	if (!symbols) {
		functions = [];
		return;
	}
	// TODO: implement regex recognition for js (jstmLanguage.json)
	functions = flattenSymbols(symbols)
		.filter(symbol => symbol.kind === vscode.SymbolKind.Method
			|| symbol.kind === vscode.SymbolKind.Function
			|| symbol.kind === vscode.SymbolKind.Constructor)
		.sort((a, b) => a.selectionRange.start.compareTo(b.selectionRange.start));
	isCacheValid = true;
};

const findNextFunctionIndex = (position) => {
	let start = 0;
	let end = functions.length - 1;
	// binary search's boiler plate makes it not worth it, but it is fancy
	while (start <= end) {
		const mid = Math.floor((start + end) / 2);
		// Using selectionRange sounds hacky but jumps through comments and docs
		const functionPosition = functions[mid].selectionRange.start;
		if (functionPosition.isEqual(position)) {
			return mid + 1;
		}
		else if (functionPosition.isAfter(position)) {
			end = mid - 1;
		} else {
			start = mid + 1;
		}
	}
	return start;
};

const getFunction = (direction) => {
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
		if (!isCacheValid || functions.length === 0) {
			await updateFunctionsCache(document);
		}
		const functionIndex = findNextFunctionIndex(position);
		let targetFunction = null;
		if (direction === 'next') {
			if (functionIndex < functions.length) {
				targetFunction = functions[functionIndex];
			}
		} else if (direction === 'previous') {
			if (functionIndex > 0) {
				targetFunction = functions[functionIndex - 1].selectionRange.start.isEqual(position)
					? functions[functionIndex - 2]
					: functions[functionIndex - 1];
			}
		}
		if (targetFunction) {
			editor.selection = new vscode.Selection(targetFunction.selectionRange.start, targetFunction.selectionRange.start);
			editor.revealRange(targetFunction.selectionRange);
		} else {
			vscode.window.showInformationMessage('No function found');
		}
	};
};

async function jumpToNext() {
	await getFunction('next')();
}

async function jumpToPrevious() {
	await getFunction('previous')();
}

function activate(context) {
	const disposablePrevious = vscode.commands.registerCommand('jump-to-function.jumpToPrevious', jumpToPrevious);
	context.subscriptions.push(disposablePrevious);
	const disposableNext = vscode.commands.registerCommand('jump-to-function.jumpToNext', jumpToNext);
	context.subscriptions.push(disposableNext);
	vscode.workspace.onDidChangeTextDocument(() => { isCacheValid = false });
	vscode.window.onDidChangeActiveTextEditor(() => { isCacheValid = false });
}

function deactivate() {
	// :::
}

module.exports = {
	activate,
	deactivate
};
