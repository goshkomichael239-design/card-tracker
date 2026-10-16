import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { beforeEach, describe, expect, it } from 'vitest';

import { EN } from '../src/app/en';
import { getLanguage, t } from '../src/app/i18n';
import { setLang } from './helpers';

describe('t()', () => {
  beforeEach(() => setLang('en'));

  it('translates a known text and fills the placeholders', () => {
    expect(t('Отменить создание')).toBe('Cancel creating');
    expect(t('Выполнено {done} из {target}', { done: 3, target: 10 })).toBe(
      'Done 3 of 10',
    );
  });

  it('shows an unknown text as it is', () => {
    expect(t('Этого текста нет в словаре')).toBe('Этого текста нет в словаре');
  });

  it('leaves Russian as written (and fills the placeholders)', () => {
    setLang('ru');

    expect(getLanguage()).toBe('ru');
    expect(t('Выполнено {done} из {target}', { done: 3, target: 10 })).toBe(
      'Выполнено 3 из 10',
    );
  });

  it('picks the language from the address', () => {
    setLang('en');
    expect(getLanguage()).toBe('en');
    setLang('ru');
    expect(getLanguage()).toBe('ru');
  });
});

/**
 * Every text of the interface in the code is a Russian key of the dictionary:
 * one that is missing would show up in Russian in the English app. This finds
 * every t('...') in src/ and checks the dictionary has it.
 */
describe('the English dictionary', () => {
  const walk = (dir: string): string[] =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? walk(path.join(dir, entry.name))
          : [path.join(dir, entry.name)],
      );

  const files = walk('src').filter(
    (file) =>
      /\.tsx?$/.test(file) && !/Sandbox|[\\/]en\.ts$/.test(file),
  );

  const used = new Map<string, string>();

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');

    if (!/[А-Яа-яЁё]/.test(text)) {
      continue;
    }

    const source = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 't'
      ) {
        const first = node.arguments[0];

        if (first && ts.isStringLiteralLike(first)) {
          used.set(first.text, file);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  it('finds the texts of the code', () => {
    expect(used.size).toBeGreaterThan(300);
  });

  it('has an English text for every text of the code', () => {
    const missing = [...used.keys()].filter((key) => !(key in EN));

    expect(missing).toEqual([]);
  });

  it('keeps the placeholders of every text', () => {
    const placeholders = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const broken = Object.entries(EN)
      .filter(
        ([key, value]) =>
          JSON.stringify(placeholders(key)) !==
          JSON.stringify(placeholders(value)),
      )
      .map(([key]) => key);

    expect(broken).toEqual([]);
  });
});
