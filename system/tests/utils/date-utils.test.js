/**
 * Date utility function tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import { expect, test } from 'vitest';
import { formatDisplayDate } from '../../src/utils/date-utils.js';

test('display date formatted with day month and year', () => {
    const date = new Date('2025-06-25T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('25 June 2025');
});

test('display date formatted for first day of month', () => {
    const date = new Date('2025-06-01T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('1 June 2025');
});

test('display date formatted for last day of month', () => {
    const date = new Date('2025-06-30T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('30 June 2025');
});

test('display date formatted for January', () => {
    const date = new Date('2025-01-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 January 2025');
});

test('display date formatted for February in non-leap year', () => {
    const date = new Date('2025-02-28T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('28 February 2025');
});

test('display date formatted for February in leap year', () => {
    const date = new Date('2024-02-29T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('29 February 2024');
});

test('display date formatted for March', () => {
    const date = new Date('2025-03-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 March 2025');
});

test('display date formatted for April', () => {
    const date = new Date('2025-04-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 April 2025');
});

test('display date formatted for May', () => {
    const date = new Date('2025-05-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 May 2025');
});

test('display date formatted for July', () => {
    const date = new Date('2025-07-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 July 2025');
});

test('display date formatted for August', () => {
    const date = new Date('2025-08-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 August 2025');
});

test('display date formatted for September', () => {
    const date = new Date('2025-09-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 September 2025');
});

test('display date formatted for October', () => {
    const date = new Date('2025-10-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 October 2025');
});

test('display date formatted for November', () => {
    const date = new Date('2025-11-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 November 2025');
});

test('display date formatted for December', () => {
    const date = new Date('2025-12-15T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('15 December 2025');
});

test('display date uses local date components', () => {
    const date = new Date(2025, 5, 25);
    expect(formatDisplayDate(date)).toBe('25 June 2025');
});

test('display date handles historical year', () => {
    const date = new Date('1999-12-31T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('31 December 1999');
});

test('display date handles future year', () => {
    const date = new Date('2050-01-01T12:00:00Z');
    expect(formatDisplayDate(date)).toBe('1 January 2050');
});

test('invalid date formats using JavaScript invalid date values', () => {
    const date = new Date('not-a-date');
    expect(formatDisplayDate(date)).toBe('NaN Invalid Date NaN');
});
