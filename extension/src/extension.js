const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

const wsbsdPath = "C:/WSBSD";

function getExeFiles(dir) {
    let exeFiles = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach(item => {
        const itemPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
            exeFiles = exeFiles.concat(getExeFiles(itemPath)); // Recursively search sub-folders
        } else if (item.name.startsWith("WSBSD") && item.name.endsWith(".exe")) {
            exeFiles.push(itemPath);
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

    // Step 2: Scan recursively for BSD distros
    let distros = getExeFiles(wsbsdPath);

    if (distros.length === 0) {
        vscode.window.showErrorMessage("No WSBSD distros found in C:/WSBSD or its sub-folders!");
        return;
    }

    // Step 3: Register Terminal Profiles
    distros.forEach(distroPath => {
        const distroName = path.basename(distroPath, ".exe");
        const profile = {
            name: distroName,
            shellPath: distroPath,
            iconPath: new vscode.ThemeIcon("terminal")
        };

        context.subscriptions.push(
            vscode.window.registerTerminalProfileProvider(distroName, {
                provideTerminalProfile: () => profile
            })
        );
    });

    // Step 4: Command to Open First Detected BSD Terminal
    let disposable = vscode.commands.registerCommand("wsbsd.open", () => {
        const terminal = vscode.window.createTerminal(path.basename(distros[0], ".exe"));
        terminal.sendText(`"${distros[0]}"`);
        terminal.show();
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
