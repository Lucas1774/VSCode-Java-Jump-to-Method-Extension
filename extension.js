
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const disposablePrevious = vscode.commands.registerCommand('java-jump-to-method.jumpToPrevious', jumpToPrevious);
	context.subscriptions.push(disposablePrevious);
	const disposableNext = vscode.commands.registerCommand('java-jump-to-method.jumpToNext', jumpToNext);
	context.subscriptions.push(disposableNext);
}

async function jumpToNext() {
	// ...
}

async function jumpToPrevious() {
	// ...
}

function deactivate() {
	// ...
}

module.exports = {
	activate,
	deactivate
}
