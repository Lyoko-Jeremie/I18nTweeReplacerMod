import fs, {readFile, writeFile} from 'fs';
import path from 'path';
import process from 'process';
import {promisify} from 'util';
import JSON5 from 'json5';
import console from "console";
import {isArray, isString, isNil} from "lodash";
import type {ModBootJsonAddonPlugin} from '../../../dist-BeforeSC2/ModLoader';

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
    if (isNil(ad)) {
        console.error('bootJson.addonPlugin cannot find TweeReplacerAddon');
        process.exit(1);
        return;
    }
    const adI18N = bootJson.addonPlugin?.find((T: ModBootJsonAddonPlugin) => {
        return T.modName === 'I18nTweeReplacer'
            && T.addonName === 'I18nTweeReplacerAddon';
    });

    await promisify(writeFile)(path.join(path.dirname(bootJsonFilePath), 'boot.json'), JSON.stringify(bootJson, undefined, 2), {encoding: 'utf-8'});

    console.log('=== Congratulation! bootJsonFillTool done! Everything is ok. ===');
})().catch(E => {
    console.error(E);
    process.exit(1);
});



