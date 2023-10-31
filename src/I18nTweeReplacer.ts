import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModBootJsonAddonPlugin, ModInfo} from "../../../dist-BeforeSC2/ModLoader";
import type {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import type {SC2DataInfo} from "../../../dist-BeforeSC2/SC2DataInfoCache";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import {isNil, isString, isNumber, assign, isArray, every} from "lodash";
import {CustomIterableIterator, CustomReadonlyMapHelper} from "./CustomReadonlyMapHelper";
import JSON5 from 'json5'

interface ReplaceInfo {
    addonName: string;
    mod: ModInfo;
    modZip: ModZipReader;
    replaceInfoManager?: ReplaceInfoManager;
}

export type ReplaceInfoItem = ReplaceIndex & ReplaceTableItem & FindTableItem;

export class ReplaceInfoManagerIt extends CustomReadonlyMapHelper<ItemId, ReplaceInfoItem> {

    constructor(
        public parent: ReplaceInfoManager,
    ) {
        super();
    }

    get size() {
        return this.parent.idItem.size;
    };

    entries(): IterableIterator<[ItemId, ReplaceInfoItem]> {
        return new CustomIterableIterator<[ItemId, ReplaceInfoItem], ReplaceInfoManager, ItemId[]>(
            this.parent,
            (index, p, ito) => {
                if (index >= p.idItem.size) {
                    return {done: true, value: undefined};
                } else {
                    const it = ito.cache[index];
                    const itt = this.get(it);
                    // console.log('entries()', index, it, itt);
                    if (!it || !itt) {
                        console.error('entries() (!it || !itt)', index, it, itt);
                        throw new Error('entries() (!it || !itt)');
                    }
                    return {done: false, value: [it, itt]};
                }
            },
            Array.from(this.parent.idItem.keys()),
        );
    }

    get(key: ItemId): ReplaceInfoItem | undefined {
        const id = this.parent.idItem.get(key);
        if (isNil(id)) {
            return undefined;
        }
        // TODO use language and fallback
        return assign({}, id, this.parent.replaceItem.get(key), this.parent.findItem.get(key));
    }

    has(key: ItemId): boolean {
        return this.parent.idItem.has(key);
    }

}

export class ReplaceInfoManager {

    idItem: Map<ItemId, ReplaceIndex> = new Map<ItemId, ReplaceIndex>();
    replaceItem: Map<string, Map<ItemId, ReplaceTableItem>> = new Map<string, Map<ItemId, ReplaceTableItem>>()
    findItem: Map<string, Map<ItemId, FindTableItem>> = new Map<string, Map<ItemId, FindTableItem>>()

    // TODO load language from ModLoader.LanguageManager
    findLanguage: string;
    fallbackFindLanguage: string;
    replaceLanguage: string;
    fallbackReplaceLanguage: string;

    constructor(
        private logger: LogWrapper,
        private modName: string,
    ) {
    }

    getReadOnlyMap() {
        return new ReplaceInfoManagerIt(this);
    }

    addIdItem(item: ReplaceIndex) {
        if (!checkReplaceIndex(item)) {
            console.error(`[ReplaceInfoMI18nTweeReplacer ReplaceInfoManager] addIdItem() mod[${this.modName}] invalid IdItem:`, item);
            this.logger.error(`[I18nTweeReplacer ReplaceInfoManager] addIdItem() mod[${this.modName}] invalid IdItem: [${item}]`);
            return;
        }
        if (this.idItem.has(item.id)) {
            console.warn(`[I18nTweeReplacer ReplaceInfoManager] addIdItem() mod[${this.modName}] duplicate IdItem:`, item);
            this.logger.warn(`[I18nTweeReplacer ReplaceInfoManager] addIdItem() mod[${this.modName}] duplicate IdItem: [${item}]`);
        }
        this.idItem.set(item.id, item);
    }

    addReplaceItem(language: string, item: ReplaceTableItem) {
        if (!checkReplaceTableItem(item)) {
            console.error(`[I18nTweeReplacer ReplaceInfoManager] addReplaceItem() mod[${this.modName}] invalid ReplaceItem:`, item);
            this.logger.error(`[I18nTweeReplacer ReplaceInfoManager] addReplaceItem() mod[${this.modName}] invalid ReplaceItem: [${item}]`);
            return;
        }
        if (!this.replaceItem.has(language)) {
            this.replaceItem.set(language, new Map<ItemId, ReplaceTableItem>());
        }
        const ll = this.replaceItem.get(language)!;
        if (ll.has(item.id)) {
            console.warn(`[I18nTweeReplacer ReplaceInfoManager] addReplaceItem() mod[${this.modName}] duplicate ReplaceItem:`, item);
            this.logger.warn(`[I18nTweeReplacer ReplaceInfoManager] addReplaceItem() mod[${this.modName}] duplicate ReplaceItem: [${item}]`);
        }
        if (!this.idItem.has(item.id)) {
            console.warn(`[I18nTweeReplacer ReplaceInfoManager] addReplaceItem() mod[${this.modName}] cannot find idItem for ReplaceItem:`, item);
            this.logger.warn(`[I18nTweeReplacer ReplaceInfoManager] addReplaceItem() mod[${this.modName}] cannot find idItem for ReplaceItem: [${item}]`);
        }
        ll.set(item.id, item);
    }

    addFindItem(language: string, item: FindTableItem) {
        if (!checkFindTableItem(item)) {
            console.error(`[I18nTweeReplacer ReplaceInfoManager] addFindItem() mod[${this.modName}] invalid FindItem:`, item);
            this.logger.error(`[I18nTweeReplacer ReplaceInfoManager] addFindItem() mod[${this.modName}] invalid FindItem: [${item}]`);
            return;
        }
        if (!this.findItem.has(language)) {
            this.findItem.set(language, new Map<ItemId, FindTableItem>());
        }
        const ll = this.replaceItem.get(language)!;
        if (ll.has(item.id)) {
            console.warn(`[I18nTweeReplacer ReplaceInfoManager] addFindItem() mod[${this.modName}] duplicate FindItem:`, item);
            this.logger.warn(`[I18nTweeReplacer ReplaceInfoManager] addFindItem() mod[${this.modName}] duplicate FindItem: [${item}]`);
        }
        if (!this.idItem.has(item.id)) {
            console.warn(`[I18nTweeReplacer ReplaceInfoManager] addFindItem() mod[${this.modName}] cannot find idItem for FindItem:`, item);
            this.logger.warn(`[I18nTweeReplacer ReplaceInfoManager] addFindItem() mod[${this.modName}] cannot find idItem for FindItem: [${item}]`);
        }
        ll.set(item.id, item);
    }

    checkValid() {
        // TODO check every idItem have replaceItem and findItem
        //      and the fallback Language must have item (error it if not)
        //      and the other language need item (warn it if not)
        for (const [id, item] of this.idItem) {
            if (!this.replaceItem.has(id)) {
                console.error(`[I18nTweeReplacer ReplaceInfoManager] checkValid() mod[${this.modName}] cannot find replaceItem for id: ${id}`);
                this.logger.error(`[I18nTweeReplacer ReplaceInfoManager] checkValid() mod[${this.modName}] cannot find replaceItem for id: ${id}`);
            }
            if (!this.findItem.has(id)) {
                console.error(`[I18nTweeReplacer ReplaceInfoManager] checkValid() mod[${this.modName}] cannot find findItem for id: ${id}`);
                this.logger.error(`[I18nTweeReplacer ReplaceInfoManager] checkValid() mod[${this.modName}] cannot find findItem for id: ${id}`);
            }
        }
    }
}

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

export function checkReplaceIndex(a: any): a is ReplaceIndex {
    return a
        && (isString(a.id) || isNumber(a.id))
        && isString(a.passage)
        ;
}

export function checkFindTableItem(a: any): a is FindTableItem {
    return a
        && (isString(a.id) || isNumber(a.id))
        && (isString(a.findString) || isString(a.findRegex))
        ;
}

export function checkReplaceTableItem(a: any): a is ReplaceTableItem {
    return a
        && (isString(a.id) || isNumber(a.id))
        && (isString(a.replace) || isString(a.replaceFile))
        ;
}

export function checkReplaceConfig(a: any): a is ReplaceConfig {
    return a
        && isString(a.replaceIndexFile)
        && isString(a.mainFindLanguage)
        && isString(a.mainReplaceLanguage)
        && isArray(a.findLanguageFile)
        && every(a.findLanguageFile, T => isString(T.language) && isString(T.file))
        && isArray(a.replaceLanguageFile)
        && every(a.replaceLanguageFile, T => isString(T.language) && isString(T.file))
        ;
}

export class I18nTweeReplacer implements AddonPluginHookPointEx {
    private readonly logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.logger = gModUtils.getLogger();
        this.gModUtils.getAddonPluginManager().registerAddonPlugin(
            'I18nTweeReplacer',
            'I18nTweeReplacerAddon',
            this,
        );
    }

    info: Map<string, ReplaceInfo> = new Map<string, ReplaceInfo>();

    async registerMod(addonName: string, mod: ModInfo, modZip: ModZipReader) {
        const r: ReplaceInfo = {
            addonName,
            mod,
            modZip,
            replaceInfoManager: new ReplaceInfoManager(this.logger, mod.name),
        };
        this.info.set(mod.name, r);
        await this.loadLanguage(r);
    }

    async afterPatchModToGame() {
        const scOld = this.gSC2DataManager.getSC2DataInfoAfterPatch();
        const sc = scOld.cloneSC2DataInfo();
        for (const [name, ri] of this.info) {
            try {
                await this.do_patch(ri, sc);
                ri.replaceInfoManager = undefined;
            } catch (e: any | Error) {
                console.error(e);
                this.logger.error(`[I18nTweeReplacer]: ${name} ${e?.message ? e.message : e}`);
            }
        }
        sc.passageDataItems.back2Array();
        this.gModUtils.replaceFollowSC2DataInfo(sc, scOld);
    }

    async loadLanguage(ri: ReplaceInfo) {
        if (!ri.replaceInfoManager) {
            // invalid inner state . never go there
            console.error('[I18nTweeReplacer] loadLanguage() (!ri.replaceInfoManager). invalid inner state . never go there.', [ri]);
            this.logger.error(`[I18nTweeReplacer] loadLanguage() (!ri.replaceInfoManager). invalid inner state . never go there. [${ri.mod.name}]`);
            return;
        }
        const ad = ri.mod.bootJson.addonPlugin?.find((T: ModBootJsonAddonPlugin) => {
            return T.modName === 'I18nTweeReplacer'
                && T.addonName === 'I18nTweeReplacerAddon';
        });
        if (!ad) {
            // never go there
            console.error('[I18nTweeReplacer] do_patch() (!ad).', [ri.mod]);
            return;
        }
        const params = ad.params;
        if (!checkReplaceConfig(params)) {
            console.error('[I18nTweeReplacer] do_patch() !checkReplaceConfig(params).', [ri.mod]);
            this.logger.error(`[I18nTweeReplacer] do_patch() invalid params: ${ri.mod.name}`);
            return;
        }

        const replaceIndex = await this.readFile(ri.modZip, params.replaceIndexFile, 'replaceIndexFile');
        if (!(isArray(replaceIndex) && every(replaceIndex, checkReplaceIndex))) {
            console.error('[I18nTweeReplacer] do_patch() invalid replaceIndex.', [ri.mod, replaceIndex]);
            this.logger.error(`[I18nTweeReplacer] do_patch() invalid replaceIndex: ${ri.mod.name}`);
            return;
        }
        replaceIndex.forEach(T => ri.replaceInfoManager!.addIdItem(T));

        for (const p of params.findLanguageFile) {
            const findLanguageFile = await this.readFile(ri.modZip, p.file, 'findLanguageFile');
            if (!(isArray(findLanguageFile) && every(findLanguageFile, checkFindTableItem))) {
                console.error('[I18nTweeReplacer] do_patch() invalid findLanguageFile.', [ri.mod, findLanguageFile]);
                this.logger.error(`[I18nTweeReplacer] do_patch() invalid findLanguageFile: ${ri.mod.name}`);
                continue;
            }
            findLanguageFile.forEach(T => ri.replaceInfoManager!.addFindItem(p.language, T));
        }
        for (const p of params.replaceLanguageFile) {
            const replaceLanguageFile = await this.readFile(ri.modZip, p.file, 'replaceLanguageFile');
            if (!(isArray(replaceLanguageFile) && every(replaceLanguageFile, checkReplaceTableItem))) {
                console.error('[I18nTweeReplacer] do_patch() invalid replaceLanguageFile.', [ri.mod, replaceLanguageFile]);
                this.logger.error(`[I18nTweeReplacer] do_patch() invalid replaceLanguageFile: ${ri.mod.name}`);
                continue;
            }
            replaceLanguageFile.forEach(T => ri.replaceInfoManager!.addReplaceItem(p.language, T));
        }

        ri.replaceInfoManager.fallbackFindLanguage = params.mainFindLanguage;
        ri.replaceInfoManager.fallbackReplaceLanguage = params.mainReplaceLanguage;

        ri.replaceInfoManager.checkValid();

        console.log('[I18nTweeReplacer] loadLanguage result:', ri.replaceInfoManager);
        this.logger.log(`[I18nTweeReplacer] loadLanguage mod[${ri.mod.name}] ok.`)
    }

    async readFile(modZip: ModZipReader, p: string, t: string) {
        try {
            const f = await modZip.zip.file(p)?.async('string');
            if (!isString(f)) {
                console.error(`[I18nTweeReplacer] cannot load ${t} , cannot read.`, [p]);
                this.logger.error(`[I18nTweeReplacer] cannot load ${t} , cannot read. [${p}]`);
                return undefined;
            }
            const nn = JSON5.parse(f);
            return nn;
        } catch (e: Error | any) {
            console.error(`[I18nTweeReplacer] cannot load ${t}[${p}] Error:`, e);
            this.logger.error(`[I18nTweeReplacer] cannot load ${t}[${p}] Error: ${e?.message ? e.message : e}`);
            return undefined;
        }
    }

    async do_patch(ri: ReplaceInfo, sc: SC2DataInfo) {
        if (!ri.replaceInfoManager) {
            // invalid inner state . never go there
            console.error('[I18nTweeReplacer] do_patch() (!ri.replaceInfoManager). invalid inner state . never go there.', [ri]);
            this.logger.error(`[I18nTweeReplacer] do_patch() (!ri.replaceInfoManager). invalid inner state . never go there. [${ri.mod.name}]`);
            return;
        }
        for (const p of ri.replaceInfoManager.getReadOnlyMap().values()) {

            // falsy value will be false
            const debugFlag = !!p.debug;

            const replaceEvery = !!p.all;

            const pp = sc.passageDataItems.map.get(p.passage);
            if (!pp) {
                console.error('[I18nTweeReplacer] do_patch() (!pp).', [ri.mod, p]);
                this.logger.error(`[I18nTweeReplacer] do_patch() cannot find passage: [${ri.mod.name}] [${p.passage}]`);
                continue;
            }
            let replaceString = p.replace;
            if (!replaceString) {
                const f = ri.modZip.zip.file(p.replaceFile!);
                const rf = await f?.async('string');
                if (!rf) {
                    console.error('[I18nTweeReplacer] do_patch() (!rf).', [ri.mod, p]);
                    this.logger.error(`[I18nTweeReplacer] do_patch() cannot find replaceFile: [${ri.mod.name}] [${p.replaceFile}]`);
                    continue;
                }
                replaceString = rf;
            }
            if (p.findString) {
                if (pp.content.indexOf(p.findString) < 0) {
                    console.error('[I18nTweeReplacer] do_patch() (pp.content.search(p.findString) < 0).', [ri.mod, p]);
                    this.logger.error(`[I18nTweeReplacer] do_patch() cannot find findString: [${ri.mod.name}] findString:[${p.findString}] in:[${pp.name}]`);
                    continue;
                }
                if (debugFlag) {
                    console.log(`[[I18nTweeReplacer]] findString :`, p.findString);
                    console.log(`[[I18nTweeReplacer]] Before:`, pp.content);
                }
                if (replaceEvery) {
                    pp.content = pp.content.replaceAll(p.findString, replaceString);
                } else {
                    pp.content = pp.content.replace(p.findString, replaceString);
                }
                if (debugFlag) {
                    console.log(`[[I18nTweeReplacer]] After:`, pp.content);
                }
            } else if (p.findRegex) {
                if (pp.content.search(new RegExp(p.findRegex)) < 0) {
                    console.error('[I18nTweeReplacer] do_patch() (pp.content.search(p.findRegex) < 0).', [ri.mod, p]);
                    this.logger.error(`[I18nTweeReplacer] do_patch() cannot find findRegex: [${ri.mod.name}] findRegex:[${p.findRegex}] in:[${pp.name}]`);
                    continue;
                }
                if (debugFlag) {
                    console.log(`[[I18nTweeReplacer]] findRegex :`, p.findRegex);
                    console.log(`[[I18nTweeReplacer]] Before:`, pp.content);
                }
                if (replaceEvery) {
                    pp.content = pp.content.replaceAll(new RegExp(p.findRegex), replaceString);
                } else {
                    pp.content = pp.content.replace(new RegExp(p.findRegex), replaceString);
                }
                if (debugFlag) {
                    console.log(`[[I18nTweeReplacer]] After:`, pp.content);
                }
            } else {
                console.error('[I18nTweeReplacer] do_patch() (!p.findString && !p.findRegex).', [ri.mod, p]);
                this.logger.error(`[I18nTweeReplacer] do_patch() invalid findString and findRegex: [${ri.mod.name}] [${p.findString}] [${p.findRegex}]`);
                continue;
            }
            console.log('[I18nTweeReplacer] do_patch() done.', [ri.mod, p]);
            this.logger.log(`[I18nTweeReplacer] do_patch() done: [${ri.mod.name}] [${p.passage}] [${p.findString || ''}]/[${p.findRegex || ''}]`);
        }
    }

    init() {
    }
}
