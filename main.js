'use strict';

const obsidian = require('obsidian');
const fs = require('fs');
const path = require('path');

class SymlinkRefresher extends obsidian.Plugin {
  constructor() {
    super(...arguments);
  }

  excludedFileNames = [
    ".git",
    ".obsidian"
  ]

  async onload() {
    console.log("Loading Obsidian Symlink Refresher Plugin");

    this.registerInterval(setInterval(() => {
      this.run();
    }, 30 * 1000));

    setTimeout(() => {
      this.run();
    }, 2.5 * 1000)
  }

  async run() {
    const fileNames = this.getFileNames(this.app.vault.adapter.basePath);

    return this.refreshSymlinks(fileNames, this.app.vault.adapter.basePath);
  }

  refreshSymlinks(filePaths, basePath) {
    const directories = [];
    
    for (const fileRelPath of filePaths) {
      const filePath = path.join(basePath, fileRelPath);
      const tmpPath = filePath.replace(fileRelPath, `~${fileRelPath}`);
      const stats = fs.lstatSync(filePath);

      if (!stats.isSymbolicLink(filePath) && stats.isDirectory(filePath)) {
        directories.push(filePath);

        continue;
      }

      try {
        fs.accessSync(filePath)

        const isSymlink = stats.isSymbolicLink(filePath);
        const exists = fs.existsSync(filePath);
        const hasTemp = fs.existsSync(tmpPath);
        
        if (!isSymlink) continue;

        console.log(`Refreshing ${filePath}`);

        if (exists && hasTemp) {
          fs.unlinkSync(tmpPath);
        }
        else if (exists && !hasTemp) {
          fs.renameSync(filePath, tmpPath);
          fs.renameSync(tmpPath, filePath);          
        }
        else if (!exists && hasTemp) {
          fs.renameSync(tmpPath, filePath);
        }
        else if (!exists && !hasTemp) {
          throw new Error(`Uh oh! ${filePath} is missing!`);
        }
      } catch (error) {
        console.warn(error.message, { error });

        continue;
      }
    }

    for (const directory of directories) {
      try {
        const directoryPath = path.resolve(basePath, directory);
        const fileNames = fs.readdirSync(directoryPath);

        this.refreshSymlinks(fileNames, directoryPath);
      } catch (error) {
        console.warn(error.message, { error });

        continue;
      }
    }
  }

  getFileNames(directory) {
    return fs.readdirSync(directory).filter(fileName => !this.excludedFileNames.includes(fileName));
  }
}

module.exports = SymlinkRefresher;