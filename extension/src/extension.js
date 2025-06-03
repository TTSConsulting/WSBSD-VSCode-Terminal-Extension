const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function activate(context) {
    const wsbsdPath = "C:/WSBSD";

    // Step 1: Check if WSBSD folder exists
    if (!fs.existsSync(wsbsdPath)) {
        vscode.window.showErrorMessage(
            "WSBSD is not installed! Download it from: https://github.com/TTSConsulting/WSBSD/releases"
        );
        return;
    }

    // Step 2: Scan for BSD Distros
    let distros = [];
    const files = fs.readdirSync(wsbsdPath);

    files.forEach(file => {
        if (file.startsWith("WSBSD") && file.endsWith(".exe")) {
            distros.push({
                name: file.replace(".exe", ""),
                shellPath: path.join(wsbsdPath, file),
                iconPath: new vscode.ThemeIcon("terminal")
            });
        }
    });

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
        if (distros.length === 0) {
            vscode.window.showErrorMessage("No BSD distros found in C:/WSBSD!");
            return;
        }
        const terminal = vscode.window.createTerminal(distros[0].name);
        terminal.sendText(`"${distros[0].shellPath}"`);
        terminal.show();
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
