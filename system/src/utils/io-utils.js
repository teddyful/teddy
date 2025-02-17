/**
 * I/O utility functions.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import path from 'path';

// Copy a given file to a given target directory.
function copyFile(sourceFilePath, targetDirPath) {
    fs.copyFileSync(sourceFilePath, targetDirPath);
}

// Create a directory.
function createDirectory(dirPath, recursive = true) {
    if ( !fs.existsSync(dirPath) ) {
        fs.mkdirSync(dirPath, { recursive: recursive });
    }
}

// Get a list of all files in a given directory.
function getFiles(dirPath, recursive = true) {
    const fileAndFolders = fs.readdirSync(dirPath, { recursive: recursive });
    const files = fileAndFolders.filter((item) => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        return stats.isFile();
    });
    return files;
}

// Test whether a given filename has a given extension.
function hasFileExtension(filename, extension) {
    return filename.split('.').pop().toLowerCase() == extension.toLowerCase();
}

// Test whether a given filename has an extension from a list of extensions.
function hasFileExtensions(filename, extensions) {
    return extensions.includes(filename.split('.').pop().toLowerCase());
}

// Keep only those files that exist given a list of file paths.
function keepFilesThatExist(files) {
    return files.filter(file => fs.existsSync(file));
}

// Load and parse a JSON file from the local filesystem.
function loadJsonFile(sourceFilePath) {
    return JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
}

// Test whether a given path exists.
function pathExists(sourcePath) {
    return fs.existsSync(sourcePath);
}

// Write a JSON object to file.
function writeJsonToFile(json, targetFilePath) {
    fs.writeFileSync(targetFilePath, JSON.stringify(json, null, 4), 'utf-8');
}

// Write a string object to file.
function writeStringToFile(str, targetFilePath) {
    fs.writeFileSync(targetFilePath, str, 'utf-8');
}

export { copyFile, createDirectory, getFiles, 
    hasFileExtension, hasFileExtensions, 
    keepFilesThatExist, loadJsonFile, pathExists, 
    writeJsonToFile, writeStringToFile };
