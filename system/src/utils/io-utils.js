/**
 * I/O utility functions.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import path from 'path';

// GLOB pattern - all files in a given directory path.
function allDescendantsGlob(dirPath) {
    return `${dirPath}/**`;
}

// GLOB pattern - negated directory path.
function negatedGlob(dirPath) {
    return `!${dirPath}`;
}

// Copy a given directory to a given target directory.
function copyDir(sourceDirPath, targetDirPath, recursive = true) {
    fs.cpSync(sourceDirPath, targetDirPath, { recursive: recursive });
}

// Copy a given file to a given target directory.
function copyFile(sourceFilePath, targetDirPath, 
    targetPathIncludesFilename = true) {
    if ( targetPathIncludesFilename ) {
        fs.copyFileSync(sourceFilePath, targetDirPath);
    } else {
        const filename = path.basename(sourceFilePath);
        fs.copyFileSync(sourceFilePath, path.join(targetDirPath, filename));
    }
}

// Copy a given file if it exists.
function copyFileIfExists(sourceFilePath, targetFilePath) {
    if ( sourceFilePath && pathExists(sourceFilePath) && targetFilePath ) {
        copyFile(sourceFilePath, targetFilePath);
    }
}

// Create a directory.
function createDirectory(dirPath, recursive = true) {
    if ( !fs.existsSync(dirPath) ) {
        fs.mkdirSync(dirPath, { recursive: recursive });
    }
}

// Assert that the given directory is safe to delete.
function assertSafeDeleteDir(dirPath, label) {
    if ( typeof dirPath !== 'string' || dirPath.trim().length === 0 ) {
        throw new Error(`Cannot delete ${label}: directory path is empty.`);
    }
    const normalizedPath = path.normalize(dirPath.trim());
    if ( ['/', '.', '..'].includes(normalizedPath) ) {
        throw new Error(
            `Cannot delete ${label}: unsafe directory path ` +
            `'${normalizedPath}'.`
        );
    }
    if ( normalizedPath.endsWith(`${path.sep}..`) ) {
        throw new Error(
            `Cannot delete ${label}: unsafe directory path ` +
            `'${normalizedPath}'.`
        );
    }
    return normalizedPath;
}

// Get a list of all files in a given directory.
function getFiles(dirPath, recursive = true) {
    const fileAndFolders = fs.readdirSync(dirPath, { recursive: recursive });
    const files = fileAndFolders.filter((item) => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        return stats.isFile();
    });
    return files.sort();
}

// Test whether a given filename has a given extension.
function hasFileExtension(filename, extension) {
    return filename.split('.').pop().toLowerCase() === extension.toLowerCase();
}

// Test whether a given filename has an extension from a list of extensions.
function hasFileExtensions(filename, extensions) {
    if ( !Array.isArray(extensions) ) {
        return false;
    }
    const normalizedExtensions = extensions.map(extension =>
        String(extension).toLowerCase().trim()
    );
    return normalizedExtensions.includes(
        filename.split('.').pop().toLowerCase().trim());
}

// Keep only those files that exist given a list of file paths.
function keepFilesThatExist(files) {
    return files.filter(file => fs.existsSync(file));
}

// Load a file from the local filesystem and return a string.
function loadFile(sourceFilePath) {
    return fs.readFileSync(sourceFilePath, 'utf8');
}

// Load and parse a JSON file from the local filesystem.
function loadJsonFile(sourceFilePath) {
    let fileContent;
    try {
        fileContent = fs.readFileSync(sourceFilePath, 'utf8');
    } catch (error) {
        throw new Error(
            `Failed to read JSON file '${sourceFilePath}'.`,
            { cause: error }
        );
    }
    try {
        return JSON.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse JSON file '${sourceFilePath}'.`,
            { cause: error }
        );
    }
}

// Test whether a given path exists.
function pathExists(sourcePath) {
    return fs.existsSync(sourcePath);
}

// Convert a string to a relative path.
function toRelativePath(sourcePath) {
    return String(sourcePath ?? '').replace(/^\/+/, '');
}

// Write a JSON object to file.
function writeJsonToFile(json, targetFilePath) {
    createDirectory(path.dirname(targetFilePath));
    fs.writeFileSync(targetFilePath, JSON.stringify(json, null, 4), 'utf-8');
}

// Write a string object to file.
function writeStringToFile(str, targetFilePath) {
    createDirectory(path.dirname(targetFilePath));
    fs.writeFileSync(targetFilePath, str, {encoding: 'utf8'});
}

export { allDescendantsGlob, negatedGlob, copyDir, copyFile, copyFileIfExists, 
    createDirectory, assertSafeDeleteDir, getFiles, hasFileExtension, 
    hasFileExtensions, keepFilesThatExist, loadFile, loadJsonFile, pathExists, 
    toRelativePath, writeJsonToFile, writeStringToFile };
