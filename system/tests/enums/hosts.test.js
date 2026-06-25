/**
 * Enum for web hosts tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import path from 'path';
import { expect, test } from 'vitest';
import hosts from '../../src/enums/hosts.js';

test('hosts enum exports at least one host', () => {
    expect(Object.keys(hosts).length).toBeGreaterThan(0);
});

test('each host key is a non-empty string', () => {
    for ( const host of Object.keys(hosts) ) {
        expect(host).toBeTypeOf('string');
        expect(host.trim()).toBe(host);
        expect(host.length).toBeGreaterThan(0);
    }
});

test('each host maps to a non-empty array of config files', () => {
    for ( const configFiles of Object.values(hosts) ) {
        expect(Array.isArray(configFiles)).toBe(true);
        expect(configFiles.length).toBeGreaterThan(0);
    }
});

test('each web config file path is a non-empty string', () => {
    for ( const configFiles of Object.values(hosts) ) {
        for ( const configFile of configFiles ) {
            expect(configFile).toBeTypeOf('string');
            expect(configFile.trim()).toBe(configFile);
            expect(configFile.length).toBeGreaterThan(0);
        }
    }
});

test('web config file paths are relative', () => {
    for ( const configFiles of Object.values(hosts) ) {
        for ( const configFile of configFiles ) {
            expect(path.isAbsolute(configFile)).toBe(false);
        }
    }
});

test('web config file paths use forward slashes', () => {
    for ( const configFiles of Object.values(hosts) ) {
        for ( const configFile of configFiles ) {
            expect(configFile.includes('\\')).toBe(false);
        }
    }
});

test('web config file paths do not contain parent directory segments', () => {
    for ( const configFiles of Object.values(hosts) ) {
        for ( const configFile of configFiles ) {
            expect(configFile.split('/')).not.toContain('..');
        }
    }
});

test('web config file paths do not start with current directory segments', () => {
    for ( const configFiles of Object.values(hosts) ) {
        for ( const configFile of configFiles ) {
            expect(configFile.split('/')).not.toContain('.');
        }
    }
});

test('web config file paths are unique per host', () => {
    for ( const configFiles of Object.values(hosts) ) {
        expect(new Set(configFiles).size).toBe(configFiles.length);
    }
});

test('web config filenames are present', () => {
    for ( const configFiles of Object.values(hosts) ) {
        for ( const configFile of configFiles ) {
            expect(path.basename(configFile).length).toBeGreaterThan(0);
        }
    }
});

test('host keys use lowercase kebab-case', () => {
    for ( const host of Object.keys(hosts) ) {
        expect(host).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
});
