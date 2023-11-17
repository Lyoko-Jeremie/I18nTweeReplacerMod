import fs, {readFile, writeFile} from 'fs';
import path from 'path';
import process from 'process';
import {promisify} from 'util';
import JSON5 from 'json5';
import {isArray, isString, isNil} from "lodash";
import type {ModBootJsonAddonPlugin} from '../../../dist-BeforeSC2/ModLoader';

// https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript

/*
    cyrb53 (c) 2018 bryc (github.com/bryc)
    License: Public domain. Attribution appreciated.
    A fast and simple 53-bit string hash function with decent collision resistance.
    Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
*/
const cyrb53 = function (str: string, seed = 0): number {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};


export namespace TweeReplacer {
    export interface ReplaceParams {
        passage: string;
        findString?: string;
        findRegex?: string;
        replace?: string;
        replaceFile?: string;
        debug?: boolean;
        // replace all , otherwise only first one
        all?: boolean;
    }
}

export namespace I18NTweeReplacer {

    export type ItemId = string | number;

    export interface ReplaceTableItem {
        id: ItemId;
        replace?: string;
        replaceFile?: string;
        noop?: boolean;
    }

    export interface FindTableItem {
        id: ItemId;
        findString?: string;
        findRegex?: string;
        noop?: boolean;
    }

    export interface ReplaceIndex {
        id: ItemId;
        passage: string;
        debug?: boolean;
        // replace all , otherwise only first one
        all?: boolean;
    }

    export interface LanguageFileItem {
        language: string;
        file: string;
    }

    export interface ReplaceConfig {
        replaceIndexFile: string;
        mainFindLanguage: string;
        mainReplaceLanguage: string;
        findLanguageFile: LanguageFileItem[];
        replaceLanguageFile: LanguageFileItem[];
    }

}

;(async () => {

    console.log('process.argv.length', process.argv.length);
    console.log('process.argv', process.argv);
    const bootJsonFilePath = process.argv[2];
    console.log('bootJsonFilePath', bootJsonFilePath);
    if (!bootJsonFilePath) {
        console.error('no bootJsonFilePath');
        process.exit(1);
        return;
    }
    const bootJsonF = await promisify(readFile)(bootJsonFilePath, {encoding: 'utf-8'});

    const bootJson = JSON5.parse(bootJsonF);

    if (!isArray(bootJson.addonPlugin)) {
        console.error('bootJson.addonPlugin is not array');
        process.exit(1);
        return;
    }
    const ad = bootJson.addonPlugin.find((T: ModBootJsonAddonPlugin) => {
        return T.modName === 'TweeReplacer'
            && T.addonName === 'TweeReplacerAddon';
    });
    if (isNil(ad?.params) || !isArray(ad.params)) {
        console.error('bootJson.addonPlugin cannot find TweeReplacerAddon');
        process.exit(1);
        return;
    }

    const calcIdFromItem = (p: TweeReplacer.ReplaceParams, count: number) => {
        if (!isString(p.findString || p.findRegex)) {
            throw new Error(`findString or findRegex must be string in ${JSON.stringify(p)}`);
        }
        return `${p.passage}_${'' + cyrb53(p.findString || p.findRegex || '', count)}`;
    }

    const trrp: TweeReplacer.ReplaceParams[] = ad.params;
    const trrpCount = new Map<string, number>();
    const indexList: I18NTweeReplacer.ReplaceIndex[] = [];
    const findList: I18NTweeReplacer.FindTableItem[] = [];
    const replaceList: I18NTweeReplacer.ReplaceTableItem[] = [];
    for (let i = 0; i < trrp.length; i++) {
        const T = trrp[i];
        // check and void collision
        let id = calcIdFromItem(T, 0);
        if (trrpCount.has(id)) {
            trrpCount.set(id, trrpCount.get(id)! + 1);
            id = calcIdFromItem(T, trrpCount.get(id)!);
        } else {
            trrpCount.set(id, 0);
        }
        indexList.push({
            id: id,
            // @ts-ignore
            id_string: `${T.passage}_${T.findString || T.findRegex}`,
            passage: T.passage,
            debug: T.debug,
            all: T.all,
        });
        findList.push({
            id: id,
            findString: T.findString,
            findRegex: T.findRegex,
        });
        replaceList.push({
            id: id,
            replace: T.replace,
            replaceFile: T.replaceFile,
        });
    }
    const replaceConfig: I18NTweeReplacer.ReplaceConfig = {
        replaceIndexFile: 'replaceIndex.json',
        mainFindLanguage: 'en',
        mainReplaceLanguage: 'zh',
        findLanguageFile: [
            {
                language: 'en',
                file: 'find_en.json',
            },
        ],
        replaceLanguageFile: [
            {
                language: 'zh',
                file: 'replace_zh.json',
            },
        ],
    };
    const addonConfig = {
        "modName": "I18nTweeReplacer",
        "addonName": "I18nTweeReplacerAddon",
        "modVersion": "^1.0.0",
        "params": replaceConfig,
    };

    await promisify(writeFile)(path.join(path.dirname(bootJsonFilePath), replaceConfig.replaceIndexFile), JSON.stringify(indexList, null, 2), {encoding: 'utf-8'});
    await promisify(writeFile)(path.join(path.dirname(bootJsonFilePath), replaceConfig.findLanguageFile[0].file), JSON.stringify(findList, null, 2), {encoding: 'utf-8'});
    await promisify(writeFile)(path.join(path.dirname(bootJsonFilePath), replaceConfig.replaceLanguageFile[0].file), JSON.stringify(replaceList, null, 2), {encoding: 'utf-8'});
    await promisify(writeFile)(path.join(path.dirname(bootJsonFilePath), 'addonConfig.json'), JSON.stringify(addonConfig, null, 2), {encoding: 'utf-8'});

    console.log('=== Congratulation! bootJsonFillTool done! Everything is ok. ===');
})().catch(E => {
    console.error(E);
    process.exit(1);
});



