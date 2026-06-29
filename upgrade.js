/**
 * Teddy upgrader bootstrapper and worker.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since  0.0.15
 */

import { Command } from 'commander';
import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import packageConfig from './package.json' with { type: 'json' };
import upgradeConfig from './config/release.json' with { type: 'json' };
import logger from './system/src/middleware/logger.js';
import Upgrader from './system/src/services/upgrade/upgrader.js';

/* -----------------------------------------------------------------------------
 * BOOTSTRAP WORKER
 * ---------------------------------------------------------------------------*/

const CURRENT_TEDDY_ROOT = dirname(fileURLToPath(import.meta.url));

function runUpgradeWorker(workerScriptPath, args) {
    return new Promise((resolvePromise, reject) => {
        const child = spawn(
            process.execPath,
            [
                workerScriptPath,
                '--upgrade-worker',
                '--target',
                args.target,
                ...(args.skipInstall ? ['--skip-install'] : []),
                ...(args.dryRun ? ['--dry-run'] : []),
                ...(args.deleteBackup ? ['--delete-backup'] : [])
            ],
            {
                stdio: 'inherit',
                cwd: args.target
            }
        );
        child.on('error', reject);
        child.on('close', code => resolvePromise(code ?? 1));
    });
}

async function runBootstrap(opts) {
    const upgrader = new Upgrader({
        ...opts,
        pathToTeddy: CURRENT_TEDDY_ROOT
    }, upgradeConfig);
    const preparedUpgrade = await upgrader.prepareUpgrade();
    if (!preparedUpgrade.upgradeAvailable) {
        return preparedUpgrade.statusCode;
    }
    const workerStatusCode = await runUpgradeWorker(
        preparedUpgrade.workerScriptPath,
        {
            target: CURRENT_TEDDY_ROOT,
            deleteBackup: opts.deleteBackup,
            dryRun: opts.dryRun,
            skipInstall: opts.skipInstall
        }
    );
    if (workerStatusCode === 0) {
        upgrader.cleanupPreparedUpgrade(preparedUpgrade);
    }
    return workerStatusCode;
}

async function runWorker(opts) {
    const upgrader = new Upgrader({
        ...opts,
        pathToTeddy: opts.target
    }, upgradeConfig);
    await upgrader.upgradeTarget();
    return upgrader.statusCode;
}

/* -----------------------------------------------------------------------------
 * CLI with variadic options
 * ---------------------------------------------------------------------------*/

function printBanner() {
    console.log('');
    console.log('           _     _');
    console.log('          ( \\---/ )');
    console.log('           ) . . (');
    console.log(' ____,--._(___Y___)_,--.____');
    console.log("     `--'           `--'");
    console.log("        TEDDY UPGRADER");
    console.log("         teddyful.com");
    console.log(' ___________________________');
    console.log('');
    console.log('');
}

const program = new Command();
program
    .name(packageConfig.name)
    .description(packageConfig.description)
    .version(packageConfig.version)
    .option(
        '--delete-backup', 
        'Delete the backup of the pre-upgraded instance of Teddy after a successful upgrade', 
        false)
    .option(
        '--yes',
        'Automatically confirm the upgrade prompt',
        false
    )
    .option(
        '--skip-install',
        'Skip npm install after the upgrade has been copied',
        false
    )
    .option(
        '--dry-run',
        'Validate and simulate the upgrade without deleting, copying, backing up, or installing dependencies',
        false
    )
    .option(
        '--upgrade-worker',
        'Run as the extracted release upgrade worker',
        false
    )
    .option(
        '--target <path>',
        'Target Teddy root path when running as an upgrade worker'
    )
    .action(async function(opts) {
        printBanner();
        logger.info('Started the Teddy upgrader app ' + 
            `(v${packageConfig.version}).`);
        if (opts.upgradeWorker && !opts.target) {
            throw new Error(
                "The '--target <path>' option is required when running " +
                "with '--upgrade-worker'."
            );
        }
        const statusCode = opts.upgradeWorker ?
            await runWorker(opts) :
            await runBootstrap(opts);
        logger.info('Exiting the Teddy upgrader app ' + 
            `(exitCode = ${statusCode}).`);
        setTimeout(() => {
            process.exit(statusCode);
        }, 2000);
    })
    .showHelpAfterError()
    .showSuggestionAfterError();

try {
    await program.parseAsync();
} catch (error) {
    logger.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
}
