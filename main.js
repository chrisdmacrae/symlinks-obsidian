'use strict';

var obsidian = require('obsidian');
var fs = require('fs');
var path = require('path');

class SymlinkRefresher extends obsidian.Plugin {
    constructor() {
        super(...arguments);
    }

    refreshed = [];

    async onload() {
        console.log("Loading plugin");
        console.log(this);

        this.vault = this.app.vault;

        this.registerInterval(window.setInterval(() => {
            this.refreshFiles();
        }, 30 * 1000));

        console.log(this.vault);
        window.setTimeout(() => this.refreshFiles(), 0);
    }

    initLeaf() {
        if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE).length > 0) {
            return;
        }
        
        this.app.workspace.getRightLeaf(true).setViewState({
            type: VIEW_TYPE_TIMELINE,
        });
    }

    refreshFiles() {
        const files = fs.readdirSync(this.vault.adapter.basePath);

        files.forEach(file => {
            const filePath = path.join(this.vault.adapter.basePath, file);
            const tmpPath = filePath + ".tmp";
            const stats = fs.lstatSync(filePath)
            const isRefreshed = this.refreshed.indexOf(filePath) > -1;

            if (!isRefreshed && stats.isSymbolicLink() && fs.existsSync(filePath) && !fs.existsSync(tmpPath)) {                
                fs.renameSync(filePath, tmpPath);
                this.refreshed.push(filePath);
            }

            if (fs.existsSync(tmpPath) && !fs.existsSync(filePath)) {
                fs.renameSync(tmpPath, filePath);
                this.refreshed.push(filePath);
            }
            else if (fs.existsSync(tmpPath)) {
                fs.unlinkSync(tmpPath);
            }
        });
    }

    onunload() {
        console.log("Unloading plugin");
    }
}

module.exports = SymlinkRefresher;