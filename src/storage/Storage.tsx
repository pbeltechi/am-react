import {Plugins} from '@capacitor/core';

const {Storage} = Plugins;

export class LocalStorage {

    static async set(key: string, value: any): Promise<void> {
        await Storage.set({
            key: key,
            value: JSON.stringify(value)
        });
    }

    static async get(key: string): Promise<any> {
        const ret = await Storage.get({key: key});
        if (ret?.value) {
            return JSON.parse(ret.value);
        }
        return Promise.resolve();
    }

    static async remove(key: string) {
        await Storage.remove({key: key});
    }

    static async keys(): Promise<string[]> {
        const {keys} = await Storage.keys();
        return keys;
    }

    static async clear(): Promise<void> {
        await Storage.clear();
    }
}
