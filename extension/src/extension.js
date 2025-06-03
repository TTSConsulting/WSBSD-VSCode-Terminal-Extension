const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

const wsbsdPath = "C:/WSBSD";

function getExeFilesRecursively(dir) {
    let exeFiles = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach(item => {
        const itemPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            exeFiles = exeFiles.concat(getExeFilesRecursively(itemPath)); // Dive deeper
        } else if (item.name.startsWith("WSBSD") && item.name.endsWith(".exe")) { // More flexible match
            exeFiles.push({
                name: item.name.replace(".exe", ""),
                shellPath: itemPath,
                iconPath: new vscode.ThemeIcon("terminal")
            });
        }
    });

    return exeFiles;
}

function activate(context) {
    // Step 1: Check if WSBSD folder exists
    if (!fs.existsSync(wsbsdPath)) {
        vscode.window.showErrorMessage(
            "WSBSD is not installed! Download it from: https://github.com/TTSConsulting/WSBSD/releases"
        );
        return;
    }

    // Step 2: Scan ALL sub-folders for BSD distros
    let distros = getExeFilesRecursively(wsbsdPath);

    if (distros.length === 0) {
        vscode.window.showErrorMessage("No WSBSD distros found in C:/WSBSD or its sub-folders!");
        return;
    }

    // Step 3: Register Terminal Profiles
    distros.forEach(distro => {
        context.subscriptions.push(
            vscode.window.registerTerminalProfileProvider(distro.name, {
                provideTerminalProfile: () => distro
            })
        );
    });

    // Step 4: Command to Open First Detected BSD Terminal
    let disposable = vscode.commands.registerCommand("wsbsd.open", () => {
        const terminal = vscode.window.createTerminal(distros[0].name);
        terminal.sendText(`"${distros[0].shellPath}"`);
        terminal.show();
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
