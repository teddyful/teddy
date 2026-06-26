/**
 * Upgrader service test fixture helpers.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { once } from 'events';

const REPO_ROOT = process.env.TEDDY_UPGRADE_TEST_REPO_ROOT ?? process.cwd();
const TEST_ROOT = path.join(REPO_ROOT, 'working', 'tests', 'upgrade');

const RESOURCE_DIRECTORIES = [
    'config',
    'docs',
    'sites/travelbook/assets',
    'sites/travelbook/languages',
    'sites/travelbook/pages',
    'sites/travelbook/web',
    'system',
    'themes/bear'
];

const RESOURCE_FILES = [
    '.gitignore',
    'AUTHORS',
    'build.js',
    'COPYRIGHT',
    'LICENSE',
    'package.json',
    'package-lock.json',
    'README.md',
    'SECURITY.md',
    'THIRD_PARTY_NOTICES.md',
    'upgrade.js',
    'sites/travelbook/site.json'
];

function createTestDir(name) {
    const dirPath = path.join(TEST_ROOT, name);
    fs.rmSync(dirPath, { recursive: true, force: true });
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
}

function writeFile(filePath, content = '') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function writeJson(filePath, value) {
    writeFile(filePath, JSON.stringify(value, null, 4));
}

function createUpgradeConfig({
    latestUrl = 'http://127.0.0.1/releases/latest',
    downloadBaseUrl = 'http://127.0.0.1/releases/download/v${version}'
} = {}) {
    return {
        dirs: {
            backup: './working/upgrade/backups',
            download: './working/upgrade/downloads'
        },
        releases: {
            latest: latestUrl,
            notes: 'http://127.0.0.1/releases',
            tag: 'http://127.0.0.1/releases/tag/v${version}',
            download: {
                baseUrl: downloadBaseUrl,
                archive: 'teddy-${version}.zip',
                checksums: 'teddy-${version}-checksums.txt'
            }
        },
        system: {
            resources: {
                directories: RESOURCE_DIRECTORIES,
                files: RESOURCE_FILES
            }
        }
    };
}

function createMinimalTeddy(rootPath, {
    version = '0.0.15',
    marker = 'old',
    upgradeConfig = createUpgradeConfig()
} = {}) {
    for ( const dir of RESOURCE_DIRECTORIES ) {
        fs.mkdirSync(path.join(rootPath, dir), { recursive: true });
        writeFile(path.join(rootPath, dir, '.keep'), marker);
    }
    writeJson(path.join(rootPath, 'package.json'), {
        name: 'teddy',
        version,
        description: 'Test Teddy fixture',
        private: true,
        type: 'module',
        scripts: {
            upgrade: 'node upgrade.js'
        }
    });
    writeJson(path.join(rootPath, 'package-lock.json'), {
        name: 'teddy',
        version,
        lockfileVersion: 3,
        packages: {
            '': {
                name: 'teddy',
                version
            }
        }
    });
    writeJson(path.join(rootPath, 'config', 'upgrade.json'), upgradeConfig);
    writeJson(path.join(rootPath, 'sites', 'travelbook', 'site.json'), {
        site: {
            name: 'travelbook',
            version
        }
    });
    for ( const file of RESOURCE_FILES ) {
        const filePath = path.join(rootPath, file);
        if ( !fs.existsSync(filePath) ) {
            writeFile(filePath, `${marker}:${file}`);
        }
    }
    writeFile(path.join(rootPath, 'build.js'), `export default '${marker}';\n`);
    writeFile(path.join(rootPath, 'README.md'), `# Teddy ${version}\n`);
    writeFile(path.join(rootPath, 'system', 'VERSION.txt'), marker);
    writeFile(path.join(rootPath, 'themes', 'bear', 'VERSION.txt'), marker);
    writeFile(path.join(rootPath, 'sites', 'travelbook', 'assets', 'VERSION.txt'),
        marker);
}

function copyRuntimeUpgradeCode(releaseRootPath, repoRootPath = REPO_ROOT) {
    fs.cpSync(
        path.join(repoRootPath, 'system', 'src'),
        path.join(releaseRootPath, 'system', 'src'),
        { recursive: true }
    );
    fs.copyFileSync(
        path.join(repoRootPath, 'upgrade.js'),
        path.join(releaseRootPath, 'upgrade.js')
    );
}

function listFiles(rootPath) {
    const files = [];
    function walk(currentPath) {
        for ( const entry of fs.readdirSync(currentPath, { withFileTypes: true }) ) {
            const entryPath = path.join(currentPath, entry.name);
            if ( entry.isDirectory() ) {
                walk(entryPath);
            } else if ( entry.isFile() ) {
                files.push(path.relative(rootPath, entryPath).replace(/\\/g, '/'));
            }
        }
    }
    walk(rootPath);
    return files.sort();
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for ( let bit = 0; bit < 8; bit++ ) {
        crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
});

function crc32(buffer) {
    let crc = 0xffffffff;
    for ( const byte of buffer ) {
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function createZipFromDirectory(sourceDirPath, targetZipPath) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    for ( const relPath of listFiles(sourceDirPath) ) {
        const filename = Buffer.from(relPath);
        const data = fs.readFileSync(path.join(sourceDirPath, relPath));
        const crc = crc32(data);
        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(0, 8);
        localHeader.writeUInt16LE(0, 10);
        localHeader.writeUInt16LE(0, 12);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(data.length, 18);
        localHeader.writeUInt32LE(data.length, 22);
        localHeader.writeUInt16LE(filename.length, 26);
        localHeader.writeUInt16LE(0, 28);
        localParts.push(localHeader, filename, data);
        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(0, 12);
        centralHeader.writeUInt16LE(0, 14);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(data.length, 20);
        centralHeader.writeUInt32LE(data.length, 24);
        centralHeader.writeUInt16LE(filename.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);
        centralParts.push(centralHeader, filename);
        offset += localHeader.length + filename.length + data.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(listFiles(sourceDirPath).length, 8);
    end.writeUInt16LE(listFiles(sourceDirPath).length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);
    end.writeUInt16LE(0, 20);
    writeFile(targetZipPath, Buffer.concat([
        ...localParts,
        centralDirectory,
        end
    ]));
}

function sha256(filePath) {
    return crypto
        .createHash('sha256')
        .update(fs.readFileSync(filePath))
        .digest('hex');
}

async function createOfflineReleaseServer({
    version,
    archivePath,
    checksumText
}) {
    const archiveFilename = `teddy-${version}.zip`;
    const checksumsFilename = `teddy-${version}-checksums.txt`;
    const server = http.createServer((request, response) => {
        if ( request.url === '/releases/latest' ) {
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ tag_name: `v${version}` }));
            return;
        }
        if ( request.url === `/releases/download/v${version}/${archiveFilename}` ) {
            response.setHeader('Content-Type', 'application/zip');
            response.end(fs.readFileSync(archivePath));
            return;
        }
        if ( request.url === `/releases/download/v${version}/${checksumsFilename}` ) {
            response.setHeader('Content-Type', 'text/plain');
            response.end(checksumText);
            return;
        }
        response.statusCode = 404;
        response.end('not found');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address();
    return {
        baseUrl: `http://127.0.0.1:${port}`,
        close: async () => {
            server.close();
            await once(server, 'close');
        }
    };
}

export {
    createMinimalTeddy,
    createOfflineReleaseServer,
    createTestDir,
    createUpgradeConfig,
    createZipFromDirectory,
    copyRuntimeUpgradeCode,
    RESOURCE_DIRECTORIES,
    RESOURCE_FILES,
    sha256,
    TEST_ROOT,
    writeFile,
    writeJson
};
