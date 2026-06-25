/**
 * I/O utility functions.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Root of the Teddy repository from system/src/utils/io-utils.js.
const TEDDY_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)), 
    '../../..');

// Test whether a given path exists.
function pathExists(sourcePath) {
    return fs.existsSync(sourcePath);
}

// Test whether a given path pointed to by a symlink exists.
function realpathIfExists(sourcePath) {
    if (!pathExists(sourcePath)) {
        return path.resolve(sourcePath);
    }
    return fs.realpathSync.native(sourcePath);
}

// Test whether a given path is within a given base directory.
function isPathInsideBase(baseDirPath, targetPath) {
    const relativePath = path.relative(
        path.resolve(baseDirPath),
        path.resolve(targetPath)
    );
    return relativePath === '' ||
        (
            !relativePath.startsWith('..') &&
            !path.isAbsolute(relativePath)
        );
}

// Resolve the nearest existing path.
function resolveNearestExistingPath(sourcePath) {
    let currentPath = path.resolve(sourcePath);
    while (!pathExists(currentPath)) {
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            return currentPath;
        }
        currentPath = parentPath;
    }
    return currentPath;
}

// Resolve a path pointed to by a symlink.
function resolveRealPathForBoundaryCheck(sourcePath) {
    const resolvedPath = path.resolve(sourcePath);
    if (pathExists(resolvedPath)) {
        return fs.realpathSync.native(resolvedPath);
    }
    const nearestExistingPath = resolveNearestExistingPath(resolvedPath);
    const realNearestExistingPath = realpathIfExists(nearestExistingPath);
    const unresolvedSuffix = path.relative(nearestExistingPath, resolvedPath);
    return unresolvedSuffix ?
        path.resolve(realNearestExistingPath, unresolvedSuffix) :
        realNearestExistingPath;
}

// Normalise and resolve whether a given resource is within a given base path.
function resolvePathInsideBase(resourcePath, baseDirPath, label = 'resource') {
    const normalizedResourcePath = String(resourcePath ?? '').trim();
    if (normalizedResourcePath.length === 0) {
        throw new Error(`Invalid ${label}: path is empty.`);
    }
    const resolvedBasePath = path.resolve(baseDirPath);
    const resolvedResourcePath = path.resolve(
        resolvedBasePath,
        normalizedResourcePath
    );
    if (!isPathInsideBase(resolvedBasePath, resolvedResourcePath)) {
        throw new Error(
            `Invalid ${label}: path '${resolvedResourcePath}' is outside ` +
            `allowed base directory '${resolvedBasePath}'.`
        );
    }
    const realBasePath = resolveRealPathForBoundaryCheck(resolvedBasePath);
    const realResourcePath =
        resolveRealPathForBoundaryCheck(resolvedResourcePath);
    if (!isPathInsideBase(realBasePath, realResourcePath)) {
        throw new Error(
            `Invalid ${label}: real path '${realResourcePath}' is outside ` +
            `allowed base directory '${realBasePath}'.`
        );
    }
    return resolvedResourcePath;
}

// Normalise and resolve a given root path.
function resolveConfiguredRootPath(rootPath, label = 'configured root') {
    const normalizedRootPath = String(rootPath ?? '').trim();
    if (normalizedRootPath.length === 0) {
        throw new Error(`Invalid ${label}: path is empty.`);
    }
    return path.resolve(TEDDY_ROOT, normalizedRootPath);
}

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

export { 
    allDescendantsGlob, 
    assertSafeDeleteDir, 
    copyDir, 
    copyFile, 
    copyFileIfExists, 
    createDirectory, 
    getFiles, 
    hasFileExtension, 
    hasFileExtensions, 
    keepFilesThatExist, 
    loadFile, 
    loadJsonFile, 
    negatedGlob, 
    pathExists, 
    resolveConfiguredRootPath, 
    resolvePathInsideBase, 
    toRelativePath, 
    writeJsonToFile, 
    writeStringToFile 
};
