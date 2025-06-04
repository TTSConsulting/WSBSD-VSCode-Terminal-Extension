const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;

const wsbsdPath = path.resolve("C:\\WSBSD");

function getExeFilesRecursively(dir) {
    let exeFiles = [];
    console.log('Scanning directory:', dir);
    let items = [];
    try {
        items = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.error('Error reading directory:', dir, err);
        return exeFiles;
    }

    items.forEach(item => {
        const itemPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            exeFiles = exeFiles.concat(getExeFilesRecursively(itemPath)); // Dive deeper
        } else {
            console.log('Found file:', itemPath);
            const lowerName = item.name.toLowerCase();
            if (lowerName.startsWith("wsbsd") && lowerName.endsWith(".exe")) {
                exeFiles.push({
                    name: item.name.replace(/\.exe$/i, ""),
                    shellPath: itemPath,
                    iconPath: new vscode.ThemeIcon("terminal")
                });
            }
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

    console.log('WSBSD path being scanned:', wsbsdPath);
    let distros = getExeFilesRecursively(wsbsdPath);
    console.log('Detected WSBSD distros:', distros);

    if (distros.length === 0) {
        vscode.window.showErrorMessage(`No WSBSD distros found in ${wsbsdPath} or its sub-folders!\nCheck the file names and ensure they start with 'WSBSD' and end with '.exe'.`);
        return;
    }

    // Step 2: Register Terminal Profiles
    distros.forEach(distro => {
        context.subscriptions.push(
            vscode.window.registerTerminalProfileProvider(distro.name, {
                provideTerminalProfile: () => distro
            })
        );
    });

    // Step 3: Validate Existence Before Execution
    let disposable = vscode.commands.registerCommand("wsbsd.open", () => {
        if (!fs.existsSync(distros[0].shellPath)) {
            vscode.window.showErrorMessage("WSBSD DragonBSD executable not found! Verify your installation.");
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
