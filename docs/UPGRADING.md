# Upgrading Teddy

This guide explains how to upgrade a Teddy installation with the native upgrader.

The upgrader checks GitHub for the latest Teddy release, downloads and verifies
the release archive, creates a backup of the current installation, replaces the
configured Teddy resources, verifies the upgraded installation, and installs
updated npm dependencies.

## Before Upgrading

Before running an upgrade:

- Commit or back up any local changes.
- Review the release notes at <https://github.com/teddyful/teddy/releases>.
- Run a dry run first where possible.
- Make sure the machine can access GitHub release metadata and release assets.
- Make sure npm can install dependencies if you do not use `--skip-install`.

The upgrader is designed to preserve user-created files that are not listed in
`config/upgrade.json`, but a separate manual backup is still recommended for
production installations.

## Basic Upgrade

From the root of a Teddy installation, run:

```bash
npm run upgrade
```

The upgrader will:

1. Check the latest Teddy release on GitHub.
2. Compare it with the installed version.
3. Ask for confirmation before upgrading.
4. Download the release archive and checksum file.
5. Verify the archive checksum.
6. Extract the release into `./working/upgrade/downloads`.
7. Start the extracted release as an upgrade worker.
8. Back up the current installation under `./working/upgrade/backups`.
9. Replace configured Teddy resources.
10. Run `npm install`.

If no newer version is available, no files are changed.

## Recommended Dry Run

Run a dry run before a production upgrade:

```bash
npm run upgrade -- --dry-run
```

`--dry-run` validates the worker inputs and versions without deleting, copying,
backing up, or installing dependencies.

## Non-Interactive Upgrades

To skip the confirmation prompt:

```bash
npm run upgrade -- --yes
```

This is useful for automation, but it should only be used after you are
comfortable with the release being installed.

## Skipping Dependency Installation

To upgrade files but skip the final `npm install`:

```bash
npm run upgrade -- --skip-install
```

After using `--skip-install`, install dependencies manually:

```bash
npm install
```

This option is useful for staged verification, tests, or environments where npm
installation is handled separately.

## Deleting Backups After Success

To delete the backup after a successful upgrade:

```bash
npm run upgrade -- --delete-backup
```

The backup is only deleted after the worker upgrade completes successfully. If
the upgrade fails and the failure is caught, the backup is preserved even when
`--delete-backup` was passed.

For production installations, it is usually safer to keep the backup until the
upgraded site has been verified.

## Combining Options

Options can be combined:

```bash
npm run upgrade -- --yes --dry-run
```

```bash
npm run upgrade -- --yes --skip-install
```

```bash
npm run upgrade -- --yes --delete-backup
```

## What Gets Replaced

The upgrade resource list is defined in `config/upgrade.json`.

Configured directories currently include:

- `config`
- `docs`
- `sites/travelbook/assets`
- `sites/travelbook/languages`
- `sites/travelbook/pages`
- `sites/travelbook/web`
- `system`
- `themes/bear`

Configured files currently include:

- `.gitignore`
- `AUTHORS`
- `build.js`
- `COPYRIGHT`
- `LICENSE`
- `package.json`
- `package-lock.json`
- `README.md`
- `SECURITY.md`
- `THIRD_PARTY_NOTICES.md`
- `upgrade.js`
- `sites/travelbook/site.json`

Only configured resources are replaced. User-created root files, custom sites,
and custom themes are preserved unless they are explicitly added to
`config/upgrade.json`.

Generated TravelBook build/public output may also be removed during upgrade:

- `sites/travelbook/build`
- `sites/travelbook/public`

These directories are generated build output and should not contain source
content.

## Backups and Downloads

Upgrade working files are stored under `./working/upgrade`.

Downloads and extracted releases are stored under:

```text
working/upgrade/downloads/
```

Backups are stored under:

```text
working/upgrade/backups/<timestamp>/
```

The `./working` directory is created automatically if it does not already exist.

## Failure Handling

The upgrader catches and logs common failure cases, including:

- GitHub release metadata failures.
- Changed or unavailable GitHub URLs.
- Failed release archive or checksum downloads.
- Checksum mismatch.
- Unsafe archive paths.
- Invalid extracted releases.
- Invalid target Teddy installations.
- File copy failures.
- Upgrade verification failures.
- `npm install` failures.

If preparation fails before the worker starts, the prepared download directory is
cleaned up where possible.

If the worker fails after a backup has been created, the backup is preserved and
the backup path is logged.

## Rollback and Restore

The upgrader does not currently perform automatic rollback after a partial worker
failure.

If an upgrade fails after files have been changed:

1. Read the logged backup path.
2. Stop any process using the Teddy directory.
3. Move or delete the partially upgraded Teddy files.
4. Copy the backup contents back into the Teddy root.
5. Run `npm install`.
6. Re-run the build or tests as appropriate.

For production use, keep the backup until the upgraded installation has been
verified.

## Internal Worker Mode

The `--upgrade-worker --target <path>` mode is intended for the bootstrapper.
You should not normally run it manually.

The bootstrapper starts worker mode from the extracted release so that the
currently running `upgrade.js` can itself be replaced safely.

## Testing the Upgrader

Upgrade tests are separate from the normal Teddy test suite.

Run normal tests:

```bash
npm test
```

Run upgrade tests:

```bash
npm run test:upgrade
```

The upgrade test suite is fully offline. It generates disposable Teddy fixtures
under `./working/tests/upgrade`, serves fake release metadata and release assets
from `127.0.0.1`, and does not contact GitHub.
