/**
 * Teddy upgrader service.
 * 
 * 1. Downloads, verifies, and extracts the release.
 * 2. The extracted release runs as the worker & upgrades the target Teddy tree.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since  0.0.15
 */

import * as child from 'child_process';
import fs from 'fs';
import path from 'path';
import promptSync from 'prompt-sync';
import semver from 'semver';
import sha256File from 'sha256-file';
import unzipper from 'unzipper';
import util from 'util';
import { deleteSync } from 'del';
import { finished, pipeline } from 'stream/promises';
import { Readable } from 'stream';

import logger from '../middleware/logger.js';
import {
    assertSafeDeleteDirInsideBase,
    createDirectory,
    createWriteStream,
    getProjectRoot,
    isPathInsideBase,
    loadFile,
    loadJsonFile,
    pathExists,
    resolvePathInsideBase
} from '../utils/io-utils.js';

const NODE_MODULES_DIR = 'node_modules';
const WORKING_UPGRADE_DIR = path.join('working', 'upgrade');

class Upgrader {

    constructor(opts, config) {

        // CLI options.
        this.opts = opts;

        // Config from teddy/config/upgrade.json.
        this.config = config;
        this.statusCode = 1;

        // The release root is the Teddy tree this Upgrader class is loaded from.
        // In bootstrap mode, this is the current Teddy tree.
        // In worker mode, this is the extracted latest release tree.
        this.releaseRoot = getProjectRoot(import.meta.dirname);

        // The target Teddy tree is the installation being upgraded.
        this.pathToTeddy = path.resolve(opts.pathToTeddy ?? this.releaseRoot);

        // Version comparison.
        this.currentVersionRaw = null;
        this.currentVersion = null;
        this.latestVersionRaw = null;
        this.latestVersion = null;
        this.newVersionAvailable = false;
        this.upgradeConfirmed = false;

        // Download root path.
        this.downloadRoot = resolvePathInsideBase(
            this.config.dirs.download,
            this.pathToTeddy,
            'upgrade download root'
        );

        // Backup root path.
        this.backupRoot = resolvePathInsideBase(
            this.config.dirs.backup,
            this.pathToTeddy,
            'upgrade backup root'
        );

        // Pre-download.
        this.downloadDir = null;
        this.downloadBaseUrl = null;
        this.archiveFilename = null;
        this.checksumsFilename = null;
        this.archiveFilePath = null;
        this.checksumsFilePath = null;
        this.releaseUrl = null;

        // Post-download.
        this.downloadedFileCount = 0;
        this.downloadVerified = false;

        // Extraction.
        this.extractDir = null;
        this.extractIsValid = false;

        // Backup.
        this.backupDir = null;

        // Upgrade verification.
        this.upgradeIsValid = false;
        this.upgradeStartDateTime = new Date().toISOString()
            .replace(/[-:.TZ]/g, '')
            .substring(0, 14);

    }

    // Validate that the specified path points to a valid instance of 
    // Teddy by confirming the existence of the relevant core Teddy 
    // system resources.
    #validateInstance(pathToInstanceOfTeddy) {
        for ( const resource of this.config.system.resources.directories.concat(
            this.config.system.resources.files) ) {
            resolvePathInsideBase(
                resource,
                pathToInstanceOfTeddy,
                `Teddy resource '${resource}'`
            );
            const resourcePath = path.join(pathToInstanceOfTeddy, resource);
            if ( !pathExists(resourcePath) ) {
                throw new Error(
                    `The path '${pathToInstanceOfTeddy}' does not point to ` +
                    'a valid instance of Teddy, as the following resource is ' +
                    `missing: '${resource}'.`
                );
            }
        }
        return true;
    }

    #getPackageVersion(pathToInstanceOfTeddy, label) {
        const packageConfig = loadJsonFile(
            path.join(pathToInstanceOfTeddy, 'package.json')
        );
        const rawVersion = packageConfig.version;
        const version = semver.clean(rawVersion);
        if ( !version ) {
            throw new Error(
                `The ${label} version of Teddy could not be established.`);
        }
        return { rawVersion, version };
    }

    #getCurrentVersion() {
        const { rawVersion, version } = this.#getPackageVersion(
            this.pathToTeddy,
            'current'
        );
        this.currentVersionRaw = rawVersion;
        this.currentVersion = version;
    }

    #getReleaseVersion() {
        const { rawVersion, version } = this.#getPackageVersion(
            this.releaseRoot,
            'release'
        );
        this.latestVersionRaw = rawVersion;
        this.latestVersion = version;
    }

    async #getLatestVersion() {
        const url = this.config.releases.latest;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'teddy-upgrader'
                }
            });
            if ( !response.ok ) {
                throw new Error(
                    `${response.status} ${response.statusText}: ` +
                    await response.text()
                );
            }
            const latestMetadata = await response.json();
            this.latestVersionRaw = latestMetadata.tag_name ?? 
                latestMetadata.name;
            this.latestVersion = semver.clean(this.latestVersionRaw);
            if ( !this.latestVersion ) {
                throw new Error('The latest Teddy release version could not ' + 
                    'be established.');
            }
        } catch (error) {
            throw new Error(
                'An error was encountered whilst attempting to retrieve the ' +
                `latest release metadata from ${url}.`,
                { cause: error }
            );
        }
    }

    #compareVersions() {
        this.newVersionAvailable = Boolean(
            this.currentVersion &&
            this.latestVersion &&
            semver.gt(this.latestVersion, this.currentVersion)
        );
    }

    #promptUser() {
        console.log('');
        console.log('A new version of Teddy is available!');
        console.log(`Current version: ${this.currentVersion}`);
        console.log(`Latest version: ${this.latestVersion}`);
        console.log(
            `Please read the release notes at ${this.config.releases.notes} ` +
            'before upgrading.'
        );
        const prompt = promptSync({ sigint: true });
        const response = prompt(
            `Do you wish to upgrade Teddy to v${this.latestVersion}? [Y/n]: `
        );
        if ( response.trim() === '' || /^y(es)?$/i.test(response.trim()) ) {
            this.upgradeConfirmed = true;
            console.log('Upgrade confirmed. Preparing Teddy upgrade...');
        } else {
            console.log('Upgrade declined.');
        }
        console.log('');
    }

    #createDownloadDirectory() {
        this.downloadDir = resolvePathInsideBase(
            this.latestVersion,
            this.downloadRoot,
            'upgrade version download directory'
        );
        createDirectory(this.downloadDir);
    }

    #generateDownloadUrls() {
        this.downloadBaseUrl = this.config.releases.download.baseUrl
            .replaceAll('${version}', this.latestVersion);
        this.archiveFilename = this.config.releases.download.archive
            .replaceAll('${version}', this.latestVersion);
        this.checksumsFilename = this.config.releases.download.checksums
            .replaceAll('${version}', this.latestVersion);
        this.archiveFilePath = resolvePathInsideBase(
            this.archiveFilename,
            this.downloadDir,
            'Teddy release archive'
        );
        this.checksumsFilePath = resolvePathInsideBase(
            this.checksumsFilename,
            this.downloadDir,
            'Teddy release checksums'
        );
        this.releaseUrl = this.config.releases.tag
            .replaceAll('${version}', this.latestVersion);
    }

    async #download(filename) {
        const downloadUrl = `${this.downloadBaseUrl}/${filename}`;
        const downloadFilePath = resolvePathInsideBase(
            filename,
            this.downloadDir,
            'downloaded release file'
        );
        try {
            const response = await fetch(downloadUrl, {
                headers: {
                    'User-Agent': 'teddy-upgrader'
                }
            });
            if ( !response.ok || !response.body ) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            const writer = createWriteStream(downloadFilePath);
            await finished(Readable.fromWeb(response.body).pipe(writer));
            this.downloadedFileCount += 1;
        } catch (error) {
            throw new Error(
                'An error was encountered whilst attempting to download the ' +
                `latest release of Teddy from ${downloadUrl}.`,
                { cause: error }
            );
        }
    }

    #verifyDownload() {
        const archiveFileHash = sha256File(this.archiveFilePath);
        const checksumLines = loadFile(this.checksumsFilePath)
            .split(/\r?\n/)
            .filter(line => line.trim().length > 0)
            .filter(line => line.includes(this.archiveFilename));
        if ( checksumLines.length === 1 ) {
            const expectedHash = checksumLines[0].split(/\s+/)[0].trim();
            this.downloadVerified = archiveFileHash === expectedHash;
        }
        if ( !this.downloadVerified ) {
            throw new Error(
                'The downloaded archive file failed integrity verification.');
        }
    }

    async #extractDownload() {
        this.extractDir = resolvePathInsideBase(
            `teddy-${this.latestVersion}`,
            this.downloadDir,
            'Teddy release extraction directory'
        );
        createDirectory(this.extractDir);
        const archive = await unzipper.Open.file(this.archiveFilePath);
        for ( const entry of archive.files ) {
            const entryPath = entry.path.replace(/\\/g, '/');
            const targetPath = path.resolve(this.extractDir, entryPath);
            if ( !isPathInsideBase(this.extractDir, targetPath) ) {
                throw new Error(
                    `Unsafe archive entry '${entry.path}' attempted to ` +
                    'extract outside the release extraction directory.'
                );
            }
            if ( entry.type === 'Directory' ) {
                createDirectory(targetPath);
                continue;
            }
            createDirectory(path.dirname(targetPath));
            await pipeline(entry.stream(), fs.createWriteStream(targetPath));
        }
    }

    #verifyExtraction() {
        this.extractIsValid = pathExists(this.extractDir) &&
            this.#validateInstance(this.extractDir);
        if ( !this.extractIsValid ) {
            throw new Error(
                'The extracted Teddy release could not be validated.');
        }
    }

    #getWorkerScriptPath() {
        return resolvePathInsideBase(
            'upgrade.js',
            this.extractDir,
            'extracted upgrade worker script'
        );
    }

    #createBackupDirectory() {
        this.backupDir = resolvePathInsideBase(
            this.upgradeStartDateTime,
            this.backupRoot,
            'upgrade backup directory'
        );
        createDirectory(this.backupDir);
    }

    #backupCurrentVersion() {
        const resolvedNodeModulesPath = path.join(
            this.pathToTeddy, NODE_MODULES_DIR);
        const resolvedWorkingUpgradePath = path.join(
            this.pathToTeddy, WORKING_UPGRADE_DIR);
        fs.cpSync(this.pathToTeddy, this.backupDir, {
            filter: sourcePath => {
                const resolvedSourcePath = path.resolve(sourcePath);
                if ( resolvedSourcePath === this.backupDir ||
                    isPathInsideBase(this.backupDir, resolvedSourcePath) ) {
                    return false;
                }
                if ( resolvedSourcePath === resolvedNodeModulesPath ||
                    isPathInsideBase(resolvedNodeModulesPath, 
                        resolvedSourcePath) ) {
                    return false;
                }
                if ( resolvedSourcePath === resolvedWorkingUpgradePath ||
                    isPathInsideBase(resolvedWorkingUpgradePath, 
                        resolvedSourcePath) ) {
                    return false;
                }
                return true;
            },
            preserveTimestamps: true,
            recursive: true
        });
    }

    #getConfiguredTargetDirectories() {
        return this.config.system.resources.directories.map(directory =>
            resolvePathInsideBase(
                directory,
                this.pathToTeddy,
                `target directory '${directory}'`
            )
        );
    }

    #getConfiguredTargetFiles() {
        return this.config.system.resources.files.map(file =>
            resolvePathInsideBase(
                file,
                this.pathToTeddy,
                `target file '${file}'`
            )
        );
    }

    #getGeneratedTargetDirectories() {
        return [
            path.join('sites', 'travelbook', 'build'),
            path.join('sites', 'travelbook', 'public')
        ].map(directory =>
            resolvePathInsideBase(
                directory,
                this.pathToTeddy,
                `generated target directory '${directory}'`
            )
        );
    }

    #deleteDirectoryInsideTarget(dirPath, label) {
        if ( !pathExists(dirPath) ) {
            return;
        }
        assertSafeDeleteDirInsideBase(
            path.relative(this.pathToTeddy, dirPath),
            this.pathToTeddy,
            label
        );
        deleteSync(dirPath, {
            dot: true,
            force: true
        });
    }

    #deleteResourcesFromTarget() {
        for ( const dirPath of this.#getConfiguredTargetDirectories() ) {
            this.#deleteDirectoryInsideTarget(
                dirPath, 'configured Teddy resource');
        }
        for ( const dirPath of this.#getGeneratedTargetDirectories() ) {
            this.#deleteDirectoryInsideTarget(
                dirPath, 'generated Teddy resource');
        }
        for ( const filePath of this.#getConfiguredTargetFiles() ) {
            if ( pathExists(filePath) ) {
                deleteSync(filePath, {
                    dot: true,
                    force: true
                });
            }
        }
    }

    #copyUpgradedResources() {
        for ( const directory of this.config.system.resources.directories ) {
            const sourceDir = resolvePathInsideBase(
                directory,
                this.releaseRoot,
                `release directory '${directory}'`
            );
            const targetDir = resolvePathInsideBase(
                directory,
                this.pathToTeddy,
                `target directory '${directory}'`
            );
            fs.cpSync(sourceDir, targetDir, {
                preserveTimestamps: true,
                recursive: true
            });
        }
        for ( const file of this.config.system.resources.files ) {
            const sourceFile = resolvePathInsideBase(
                file,
                this.releaseRoot,
                `release file '${file}'`
            );
            const targetFile = resolvePathInsideBase(
                file,
                this.pathToTeddy,
                `target file '${file}'`
            );
            createDirectory(path.dirname(targetFile));
            fs.copyFileSync(sourceFile, targetFile);
        }
    }

    #verifyUpgrade() {
        this.upgradeIsValid = this.#validateInstance(this.pathToTeddy);
        if ( !this.upgradeIsValid ) {
            throw new Error(
                'The upgraded Teddy instance could not be validated.');
        }
    }

    async #installUpgradedDependencies() {
        const exec = util.promisify(child.exec);
        const cmd = `npm --prefix "${this.pathToTeddy}" install`;
        try {
            await exec(cmd);
        } catch (error) {
            throw new Error(
                'An error was encountered when attempting to automatically ' +
                'install the upgraded dependencies. Please navigate to ' +
                `${this.pathToTeddy} and run 'npm install' manually.`,
                { cause: error }
            );
        }
    }

    #deleteDownloadDirectory() {
        if ( !this.downloadDir || !pathExists(this.downloadDir) ) {
            return;
        }
        logger.info('Deleting the download directory...');
        try {
            assertSafeDeleteDirInsideBase(
                path.relative(this.downloadRoot, this.downloadDir),
                this.downloadRoot,
                'upgrade download directory'
            );
            deleteSync(this.downloadDir, {
                dot: true,
                force: true
            });
        } catch (error) {
            logger.error('Could not delete the download directory at ' + 
                `${this.downloadDir}'.`);
            logger.debug(error && error.stack ? error.stack : String(error));
        }
    }

    #deleteBackupDirectory() {
        if ( !this.backupDir || 
            !pathExists(this.backupDir) || 
            !this.opts.deleteBackup ) {
            return;
        }
        logger.info('Deleting the backup directory...');
        try {
            assertSafeDeleteDirInsideBase(
                path.relative(this.backupRoot, this.backupDir),
                this.backupRoot,
                'upgrade backup directory'
            );
            deleteSync(this.backupDir, {
                dot: true,
                force: true
            });
        } catch (error) {
            logger.error('Could not delete the backup directory at ' + 
                `${this.backupDir}'.`);
            logger.debug(error && error.stack ? error.stack : String(error));
        }
    }

    cleanupPreparedUpgrade(preparedUpgrade) {
        if ( preparedUpgrade?.downloadDir ) {
            this.downloadDir = preparedUpgrade.downloadDir;
            this.#deleteDownloadDirectory();
        }
    }

    async prepareUpgrade() {
        try {
            logger.info(`Teddy path: ${this.pathToTeddy}`);
            logger.info('Stage 1 - Validating the current Teddy instance...');
            this.#validateInstance(this.pathToTeddy);
            logger.info('Stage 2 - Identifying the current version number...');
            this.#getCurrentVersion();
            logger.info('Stage 3 - Identifying the latest version number...');
            await this.#getLatestVersion();
            logger.info('Stage 4 - Comparing version numbers...');
            this.#compareVersions();
            if ( !this.newVersionAvailable ) {
                this.statusCode = 0;
                logger.info('No updates found. The instance of Teddy is ' + 
                    'already using the latest available version.'
                );
                logger.info(`Teddy location: ${this.pathToTeddy}`);
                logger.info(`Current version: ${this.currentVersion}`);
                return {
                    upgradeAvailable: false,
                    statusCode: this.statusCode
                };
            }
            logger.info('Stage 5 - Awaiting confirmation to upgrade...');
            this.#promptUser();
            if ( !this.upgradeConfirmed ) {
                this.statusCode = 0;
                return {
                    upgradeAvailable: false,
                    statusCode: this.statusCode
                };
            }
            logger.info('Stage 6 - Creating the download directory...');
            this.#createDownloadDirectory();
            logger.info('Stage 7 - Generating the download URLs...');
            this.#generateDownloadUrls();
            logger.info(
                `Stage 8 - Downloading Teddy v${this.latestVersion}...`);
            await this.#download(this.archiveFilename);
            await this.#download(this.checksumsFilename);
            if ( this.downloadedFileCount !== 2 ) {
                throw new Error(
                    'An error was encountered whilst attempting to download ' +
                    `the latest release of Teddy from ${this.downloadBaseUrl}.`
                );
            }
            logger.info('Stage 9 - Verifying the download integrity...');
            this.#verifyDownload();
            logger.info('Stage 10 - Extracting the download...');
            await this.#extractDownload();
            logger.info('Stage 11 - Verifying the extracted release...');
            this.#verifyExtraction();
            const workerScriptPath = this.#getWorkerScriptPath();
            return {
                upgradeAvailable: true,
                currentVersion: this.currentVersion,
                latestVersion: this.latestVersion,
                downloadDir: this.downloadDir,
                extractDir: this.extractDir,
                workerScriptPath,
                statusCode: 0
            };
        } catch (error) {
            this.statusCode = 1;
            logger.error(
                'An error was encountered whilst preparing the upgrade.');
            logger.error(error && error.stack ? error.stack : String(error));
            this.#deleteDownloadDirectory();
            return {
                upgradeAvailable: false,
                statusCode: this.statusCode
            };
        }
    }

    async upgradeTarget() {
        try {
            logger.info(`Release path: ${this.releaseRoot}`);
            logger.info(`Target Teddy path: ${this.pathToTeddy}`);
            if ( this.releaseRoot === this.pathToTeddy ) {
                throw new Error(
                    'The upgrade worker must run from an extracted release, ' +
                    'not from the target Teddy installation.'
                );
            }
            logger.info('Worker stage 1 - Validating the extracted release...');
            this.#validateInstance(this.releaseRoot);
            this.#getReleaseVersion();
            logger.info(
                'Worker stage 2 - Validating the target Teddy instance...');
            this.#validateInstance(this.pathToTeddy);
            this.#getCurrentVersion();
            logger.info('Worker stage 3 - Creating the backup directory...');
            this.#createBackupDirectory();
            logger.info(
                'Worker stage 4 - Creating a backup of the target instance...');
            this.#backupCurrentVersion();
            logger.info(
                'Worker stage 5 - Deleting replaceable target resources...');
            this.#deleteResourcesFromTarget();
            logger.info('Worker stage 6 - Copying upgraded resources...');
            this.#copyUpgradedResources();
            logger.info('Worker stage 7 - Verifying the upgraded target...');
            this.#verifyUpgrade();
            logger.info('Worker stage 8 - Installing upgraded dependencies...');
            await this.#installUpgradedDependencies();
            this.statusCode = 0;
            logger.info('Successfully finished upgrading Teddy!');
            logger.info(`Teddy location: ${this.pathToTeddy}`);
            logger.info(`Old version: ${this.currentVersion}`);
            logger.info(`New version: ${this.latestVersion}`);
            this.#deleteBackupDirectory();
        } catch (error) {
            this.statusCode = 1;
            logger.error(
                'An error was encountered whilst running the upgrade worker.');
            logger.error(error && error.stack ? error.stack : String(error));
            if ( this.backupDir ) {
                logger.info(
                    'The backup of your original Teddy instance may be found ' +
                    `in '${this.backupDir}'.`
                );
            }
        }
    }

}

export default Upgrader;
