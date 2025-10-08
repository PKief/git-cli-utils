import { describe, expect, it } from 'bun:test';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getEditorConfig, setEditorConfig } from '../../core/config.js';
import { configureEditor, openInConfiguredEditor } from './editor.js';

describe('Editor config utility', () => {
  it('should configure editor with path only', () => {
    const fakeBin = join(tmpdir(), 'fake-editor-bin');
    // create placeholder file
    writeFileSync(fakeBin, '#!/bin/sh\nexit 0');
    const cfg = configureEditor(fakeBin);
    expect(cfg.path).toContain('fake-editor-bin');
  });

  it('should store and retrieve editor config', () => {
    const fakeBin = join(tmpdir(), 'another-editor');
    writeFileSync(fakeBin, '#!/bin/sh\n');
    setEditorConfig({ path: fakeBin, args: ['--test'] });
    const loaded = getEditorConfig();
    expect(loaded?.path).toBe(fakeBin);
    expect(loaded?.args).toContain('--test');
  });

  it('should fail gracefully when path invalid', () => {
    setEditorConfig({ path: '/non/existent/editor/bin' });
    const opened = openInConfiguredEditor('/tmp', { silent: true });
    expect(opened).toBe(false);
  });
});
