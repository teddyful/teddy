/**
 * I/O utility function tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
    allDescendantsGlob,
    negatedGlob,
    copyDir,
    copyFile,
    copyFileIfExists,
    createDirectory,
    assertSafeDeleteDir,
    getFiles,
    hasFileExtension,
    hasFileExtensions,
    keepFilesThatExist,
    loadFile,
    loadJsonFile,
    pathExists,
    toRelativePath,
    writeJsonToFile,
    writeStringToFile
} from '../../src/utils/io-utils.js';

const TEST_DIR = './working/tests/io-utils';

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('all descendants glob generated correctly', () => {
    expect(allDescendantsGlob('dist/assets')).toBe('dist/assets/**');
});

test('negated glob generated correctly', () => {
    expect(negatedGlob('dist/assets')).toBe('!dist/assets');
});

test('directory copied recursively', () => {
    const sourceDirPath = path.join(TEST_DIR, 'source');
    const nestedDirPath = path.join(sourceDirPath, 'nested');
    const targetDirPath = path.join(TEST_DIR, 'target');
    fs.mkdirSync(nestedDirPath, { recursive: true });
    fs.writeFileSync(path.join(sourceDirPath, 'root.txt'), 'root');
    fs.writeFileSync(path.join(nestedDirPath, 'child.txt'), 'child');
    copyDir(sourceDirPath, targetDirPath);
    expect(fs.readFileSync(path.join(targetDirPath, 'root.txt'), 'utf8'))
        .toBe('root');
    expect(fs.readFileSync(
        path.join(targetDirPath, 'nested', 'child.txt'), 'utf8'))
        .toBe('child');
});

test('file copied to target file path', () => {
    const sourceFilePath = path.join(TEST_DIR, 'source.txt');
    const targetFilePath = path.join(TEST_DIR, 'target.txt');
    fs.writeFileSync(sourceFilePath, 'content');
    copyFile(sourceFilePath, targetFilePath);
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe('content');
});

test('file copied into target directory when target path excludes filename', () => {
    const sourceFilePath = path.join(TEST_DIR, 'source.txt');
    const targetDirPath = path.join(TEST_DIR, 'target');
    fs.writeFileSync(sourceFilePath, 'content');
    fs.mkdirSync(targetDirPath);
    copyFile(sourceFilePath, targetDirPath, false);
    expect(fs.readFileSync(path.join(targetDirPath, 'source.txt'), 'utf8'))
        .toBe('content');
});

test('file copied only if source file exists', () => {
    const sourceFilePath = path.join(TEST_DIR, 'source.txt');
    const targetFilePath = path.join(TEST_DIR, 'target.txt');
    fs.writeFileSync(sourceFilePath, 'content');
    copyFileIfExists(sourceFilePath, targetFilePath);
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe('content');
});

test('missing file is not copied by copyFileIfExists', () => {
    const sourceFilePath = path.join(TEST_DIR, 'missing.txt');
    const targetFilePath = path.join(TEST_DIR, 'target.txt');
    copyFileIfExists(sourceFilePath, targetFilePath);
    expect(fs.existsSync(targetFilePath)).toBe(false);
});

test('directory created recursively', () => {
    const dirPath = path.join(TEST_DIR, 'one', 'two');
    createDirectory(dirPath);
    expect(fs.existsSync(dirPath)).toBe(true);
});

test('existing directory creation is a no-op', () => {
    const dirPath = path.join(TEST_DIR, 'existing');
    fs.mkdirSync(dirPath);
    expect(() => createDirectory(dirPath)).not.toThrow();
    expect(fs.existsSync(dirPath)).toBe(true);
});

test('safe delete directory path returned normalized', () => {
    const dirPath = path.join(TEST_DIR, 'safe', '..', 'safe');
    expect(assertSafeDeleteDir(dirPath, 'test directory'))
        .toBe(path.normalize(dirPath));
});

test('empty delete directory path rejected', () => {
    expect(() => assertSafeDeleteDir('', 'test directory'))
        .toThrow('directory path is empty');
});

test('unsafe root delete directory path rejected', () => {
    expect(() => assertSafeDeleteDir('/', 'test directory'))
        .toThrow('unsafe directory path');
});

test('unsafe current directory delete path rejected', () => {
    expect(() => assertSafeDeleteDir('.', 'test directory'))
        .toThrow('unsafe directory path');
});

test('unsafe parent directory delete path rejected', () => {
    expect(() => assertSafeDeleteDir('..', 'test directory'))
        .toThrow('unsafe directory path');
});

test('delete path ending in parent segment rejected', () => {
    expect(() => assertSafeDeleteDir('../..', 'test directory'))
        .toThrow('unsafe directory path');
});

test('recursive file listing generated correctly', () => {
    const basePath = './system';
    expect(getFiles(basePath).length).toBeGreaterThanOrEqual(39);
});

test('recursive file listing generated correctly and sorted', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'b.txt'), 'b');
    fs.writeFileSync(path.join(TEST_DIR, 'a.txt'), 'a');
    fs.mkdirSync(path.join(TEST_DIR, 'nested'));
    fs.writeFileSync(path.join(TEST_DIR, 'nested', 'c.txt'), 'c');
    expect(getFiles(TEST_DIR)).toEqual([
        'a.txt',
        'b.txt',
        path.join('nested', 'c.txt')
    ]);
});

test('non-recursive file listing excludes nested files', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'a.txt'), 'a');
    fs.mkdirSync(path.join(TEST_DIR, 'nested'));
    fs.writeFileSync(path.join(TEST_DIR, 'nested', 'b.txt'), 'b');
    expect(getFiles(TEST_DIR, false)).toEqual(['a.txt']);
});

test('file extension detected case-insensitively', () => {
    expect(hasFileExtension('page.EN.MD', 'md')).toBe(true);
    expect(hasFileExtension('page.txt', 'md')).toBe(false);
});

test('file extension detected from list case-insensitively', () => {
    expect(hasFileExtensions('page.MD', [' html ', ' md '])).toBe(true);
    expect(hasFileExtensions('page.txt', ['html', 'md'])).toBe(false);
});

test('file extension list guard rejects non-array extensions', () => {
    expect(hasFileExtensions('page.md', 'md')).toBe(false);
    expect(hasFileExtensions('page.md', null)).toBe(false);
});

test('only existing files are kept', () => {
    const existingFilePath = path.join(TEST_DIR, 'existing.txt');
    const missingFilePath = path.join(TEST_DIR, 'missing.txt');
    fs.writeFileSync(existingFilePath, 'content');
    expect(keepFilesThatExist([existingFilePath, missingFilePath]))
        .toEqual([existingFilePath]);
});

test('file loaded as string', () => {
    const filePath = path.join(TEST_DIR, 'file.txt');
    fs.writeFileSync(filePath, 'content');
    expect(loadFile(filePath)).toBe('content');
});

test('JSON file loaded and parsed', () => {
    const filePath = path.join(TEST_DIR, 'data.json');
    fs.writeFileSync(filePath, JSON.stringify({ name: 'Teddy' }));
    expect(loadJsonFile(filePath)).toEqual({ name: 'Teddy' });
});

test('missing JSON file throws contextual read error', () => {
    const filePath = path.join(TEST_DIR, 'missing.json');
    expect(() => loadJsonFile(filePath))
        .toThrow(`Failed to read JSON file '${filePath}'.`);
});

test('invalid JSON file throws contextual parse error', () => {
    const filePath = path.join(TEST_DIR, 'invalid.json');
    fs.writeFileSync(filePath, '{');
    expect(() => loadJsonFile(filePath))
        .toThrow(`Failed to parse JSON file '${filePath}'.`);
});

test('path existence detected', () => {
    const filePath = path.join(TEST_DIR, 'file.txt');
    fs.writeFileSync(filePath, 'content');
    expect(pathExists(filePath)).toBe(true);
    expect(pathExists(path.join(TEST_DIR, 'missing.txt'))).toBe(false);
});

test('source path converted to relative path', () => {
    expect(toRelativePath('/assets/css')).toBe('assets/css');
    expect(toRelativePath('assets/css')).toBe('assets/css');
    expect(toRelativePath(null)).toBe('');
});

test('JSON written to file and parent directories created', () => {
    const targetFilePath = path.join(TEST_DIR, 'nested', 'data.json');
    writeJsonToFile({ name: 'Teddy' }, targetFilePath);
    expect(JSON.parse(fs.readFileSync(targetFilePath, 'utf8')))
        .toEqual({ name: 'Teddy' });
});

test('string written to file and parent directories created', () => {
    const targetFilePath = path.join(TEST_DIR, 'nested', 'file.txt');
    writeStringToFile('content', targetFilePath);
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe('content');
});

test('all descendants glob preserves trailing slash if supplied', () => {
    expect(allDescendantsGlob('dist/assets/')).toBe('dist/assets//**');
});

test('negated glob preserves trailing slash if supplied', () => {
    expect(negatedGlob('dist/assets/')).toBe('!dist/assets/');
});

test('non-recursive directory copy rejects nested source content', () => {
    const sourceDirPath = path.join(TEST_DIR, 'source');
    const nestedDirPath = path.join(sourceDirPath, 'nested');
    const targetDirPath = path.join(TEST_DIR, 'target');
    fs.mkdirSync(nestedDirPath, { recursive: true });
    fs.writeFileSync(path.join(nestedDirPath, 'child.txt'), 'child');
    expect(() => copyDir(sourceDirPath, targetDirPath, false)).toThrow();
});

test('copyFileIfExists does nothing when source path is empty', () => {
    const targetFilePath = path.join(TEST_DIR, 'target.txt');
    expect(() => copyFileIfExists('', targetFilePath)).not.toThrow();
    expect(fs.existsSync(targetFilePath)).toBe(false);
});

test('copyFileIfExists does nothing when target path is empty', () => {
    const sourceFilePath = path.join(TEST_DIR, 'source.txt');
    fs.writeFileSync(sourceFilePath, 'content');
    expect(() => copyFileIfExists(sourceFilePath, '')).not.toThrow();
});

test('non-recursive createDirectory rejects missing parent directories', () => {
    const dirPath = path.join(TEST_DIR, 'one', 'two');
    expect(() => createDirectory(dirPath, false)).toThrow();
});

test('non-string delete directory path rejected', () => {
    expect(() => assertSafeDeleteDir(null, 'test directory'))
        .toThrow('directory path is empty');
});

test('whitespace-only delete directory path rejected', () => {
    expect(() => assertSafeDeleteDir('   ', 'test directory'))
        .toThrow('directory path is empty');
});

test('safe delete directory path is trimmed before normalization', () => {
    const dirPath = path.join(TEST_DIR, 'safe');
    expect(assertSafeDeleteDir(` ${dirPath} `, 'test directory'))
        .toBe(path.normalize(dirPath));
});

test('file listing ignores directories', () => {
    fs.mkdirSync(path.join(TEST_DIR, 'directory'));
    fs.writeFileSync(path.join(TEST_DIR, 'file.txt'), 'content');
    expect(getFiles(TEST_DIR, false)).toEqual(['file.txt']);
});

test('empty directory file listing returns empty array', () => {
    expect(getFiles(TEST_DIR)).toEqual([]);
});

test('missing directory file listing throws', () => {
    expect(() => getFiles(path.join(TEST_DIR, 'missing'))).toThrow();
});

test('file extension detected for multi-dot filename', () => {
    expect(hasFileExtension('archive.tar.gz', 'gz')).toBe(true);
    expect(hasFileExtension('archive.tar.gz', 'tar')).toBe(false);
});

test('file extension detection treats extension with leading dot literally', () => {
    expect(hasFileExtension('page.md', '.md')).toBe(false);
});

test('file extension detection handles filenames without periods', () => {
    expect(hasFileExtension('README', 'md')).toBe(false);
    expect(hasFileExtension('README', 'readme')).toBe(true);
});

test('file extension detected from list with non-string extensions', () => {
    expect(hasFileExtensions('file.123', [123])).toBe(true);
});

test('file extension list returns false for empty extension list', () => {
    expect(hasFileExtensions('page.md', [])).toBe(false);
});

test('keepFilesThatExist preserves input order', () => {
    const firstFilePath = path.join(TEST_DIR, 'first.txt');
    const secondFilePath = path.join(TEST_DIR, 'second.txt');
    fs.writeFileSync(firstFilePath, 'first');
    fs.writeFileSync(secondFilePath, 'second');
    expect(keepFilesThatExist([
        secondFilePath,
        path.join(TEST_DIR, 'missing.txt'),
        firstFilePath
    ])).toEqual([
        secondFilePath,
        firstFilePath
    ]);
});

test('keepFilesThatExist keeps existing directories too', () => {
    const dirPath = path.join(TEST_DIR, 'directory');
    fs.mkdirSync(dirPath);
    expect(keepFilesThatExist([dirPath])).toEqual([dirPath]);
});

test('empty file list returns empty array', () => {
    expect(keepFilesThatExist([])).toEqual([]);
});

test('missing file load throws', () => {
    expect(() => loadFile(path.join(TEST_DIR, 'missing.txt'))).toThrow();
});

test('JSON array file loaded and parsed', () => {
    const filePath = path.join(TEST_DIR, 'data.json');
    fs.writeFileSync(filePath, JSON.stringify(['one', 'two']));
    expect(loadJsonFile(filePath)).toEqual(['one', 'two']);
});

test('JSON null file loaded and parsed', () => {
    const filePath = path.join(TEST_DIR, 'data.json');
    fs.writeFileSync(filePath, 'null');
    expect(loadJsonFile(filePath)).toBe(null);
});

test('directory path existence detected', () => {
    const dirPath = path.join(TEST_DIR, 'directory');
    fs.mkdirSync(dirPath);
    expect(pathExists(dirPath)).toBe(true);
});

test('source path with multiple leading slashes converted to relative path', () => {
    expect(toRelativePath('///assets/css')).toBe('assets/css');
});

test('undefined source path converted to empty relative path', () => {
    expect(toRelativePath(undefined)).toBe('');
});

test('numeric source path converted to string relative path', () => {
    expect(toRelativePath(123)).toBe('123');
});

test('JSON written with four-space indentation', () => {
    const targetFilePath = path.join(TEST_DIR, 'data.json');
    writeJsonToFile({ site: { name: 'Teddy' } }, targetFilePath);
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(
        '{\n' +
        '    "site": {\n' +
        '        "name": "Teddy"\n' +
        '    }\n' +
        '}'
    );
});

test('array JSON written to file', () => {
    const targetFilePath = path.join(TEST_DIR, 'data.json');
    writeJsonToFile(['one', 'two'], targetFilePath);
    expect(JSON.parse(fs.readFileSync(targetFilePath, 'utf8')))
        .toEqual(['one', 'two']);
});

test('empty string written to file', () => {
    const targetFilePath = path.join(TEST_DIR, 'empty.txt');
    writeStringToFile('', targetFilePath);
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe('');
});
