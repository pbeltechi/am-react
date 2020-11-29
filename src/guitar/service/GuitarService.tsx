import axios from 'axios';
import {Guitar} from "../Guitar";
import {AppConstants, baseUrl, httpConfig, noop, wsUrl} from "../../core/Utils";
import {LocalStorage} from '../../storage/Storage';

const {v4: uuidv4} = require('uuid');

const guitarUrl = `${baseUrl}/api/guitars`;

export const syncData: (token: string) => Promise<Guitar[]> = async (token: string) => {
    const guitars = await getGuitarsLocal('D');
    return axios.post<Guitar[]>(`${guitarUrl}/sync`, guitars, httpConfig(token))
        .then(
            response => response.data,
            () => {
                console.log('cannot sync data with server');
                return [];
            });
};

export const getAllGuitars: (token: string, isNetworkAvailable: boolean) => Promise<Guitar[]> =
    (token: string, isNetworkAvailable: boolean) => {
        return isNetworkAvailable
            ? axios.get<Guitar[]>(guitarUrl, httpConfig(token))
                .then(
                    response => response.data,
                    () => getGuitarsLocal()
                )
            : getGuitarsLocal();
    };

function setIfModifiedSinceHeader(guitars: Guitar[], config: any): void {
    if (guitars.length === 0) return;
    let ifModifiedSince = new Date(guitars[0].lastModified);
    guitars.forEach(guitar => {
        const guitarModified = new Date(guitar.lastModified);
        if (guitarModified > ifModifiedSince) {
            ifModifiedSince = guitarModified;
        }
    });
    const sec = ifModifiedSince.getSeconds();
    ifModifiedSince.setSeconds(sec + 1);
    config.headers['if-modified-since'] = ifModifiedSince.toUTCString();
}

export const getGuitars: (token: string,
                          isNetworkAvailable: boolean,
                          page: number,
                          filter?: string,
                          search?: string) => Promise<Guitar[]> =
    async (token: string, isNetworkAvailable: boolean, page: number, filter?: string, search?: string) => {
        if (isNetworkAvailable) {
            let url = `${guitarUrl}?page=${page}`;
            if (filter && filter !== '') {
                url += '&filter=' + filter;
            }
            if (search && search !== '') {
                url += '&search=' + search;
            }
            const localGuitars = await getGuitarsLocal()
                .then(guitars => paginateAndMatch(guitars, page, filter, search));
            const config = httpConfig(token);
            setIfModifiedSinceHeader(localGuitars, config);
            return axios.get<Guitar[]>(url, config)
                .then(response => {
                    console.log('200');
                    const guitars = response.data;
                    guitars
                        .forEach(guitar => {
                            const index = localGuitars.findIndex(it => it._id === guitar._id);
                            if (index === -1) {
                                localGuitars.push(guitar);
                            } else {
                                localGuitars[index] = guitar;
                            }
                            LocalStorage.set(`${AppConstants.GUITARS}/${guitar._id}`, guitar).then();
                        });
                    return localGuitars;
                })
                .catch(err => {
                    if (err.response.status === 304) {
                        console.log('304');
                        return localGuitars;
                    }
                    return getGuitarsLocal()
                        .then(guitars => paginateAndMatch(guitars, page, filter, search));
                });
        }
        return getGuitarsLocal().then(guitars => paginateAndMatch(guitars, page, filter, search));
    };

export const getGuitar: (token: string, isNetworkAvailable: boolean, id: string) => Promise<Guitar> =
    (token: string, isNetworkAvailable: boolean, id: string) => {
        if (isNetworkAvailable) {
            const url = `${guitarUrl}/${id}`;
            return axios.get<Guitar>(url, httpConfig(token))
                .then(
                    response => {
                        const guitar: Guitar = response.data;
                        LocalStorage.set(`${AppConstants.GUITARS}/${guitar._id}`, guitar).then();
                        return guitar;
                    },
                    () => LocalStorage.get(`${AppConstants.GUITARS}/${id}`)
                );
        }
        return LocalStorage.get(`${AppConstants.GUITARS}/${id}`);
    };

export const insertGuitar: (guitar: Guitar, isNetworkAvailable: boolean, token: string) => Promise<Guitar> =
    (guitar, isNetworkAvailable, token) => {
        if (isNetworkAvailable) {
            return axios.post<Guitar>(guitarUrl, guitar, httpConfig(token))
                .then(
                    response => {
                        saveGuitarLocal(response.data).then();
                        return response.data;
                    },
                    () => saveGuitarLocal(guitar)
                );
        }
        return saveGuitarLocal(guitar);
    };

export const updateGuitar: (guitar: Guitar, isNetworkAvailable: boolean, token: string) => Promise<Guitar> =
    (guitar, isNetworkAvailable, token) => {
        if (isNetworkAvailable) {
            const url = `${guitarUrl}/${guitar._id}`;
            return axios.put<Guitar>(url, guitar, httpConfig(token))
                .then(
                    response => {
                        saveGuitarLocal(response.data).then();
                        return response.data;
                    },
                    () => saveGuitarLocal(guitar)
                );
        }
        return saveGuitarLocal(guitar);
    };

export const deleteGuitar: (id: string, isNetworkAvailable: boolean, token: string) => Promise<Guitar> =
    (id, isNetworkAvailable, token) => {
        if (isNetworkAvailable) {
            const url = `${guitarUrl}/${id}`;
            return axios.delete<Guitar>(url, httpConfig(token))
                .then(
                    response => {
                        response.data?._id ? deleteGuitarLocal(response.data._id, true).then() : noop();
                        return response.data;
                    },
                    () => deleteGuitarLocal(id));
        }
        return deleteGuitarLocal(id);
    };

const PAGE_SIZE = 3;

function paginateAndMatch(guitars: Guitar[], page: number, filter?: string, search?: string): Guitar[] {
    if (filter) {
        guitars = guitars.filter(guitar => guitar.model === filter);
    }
    if (search) {
        guitars = guitars.filter(guitar => guitar.model.indexOf(search) >= 0);
    }
    guitars.sort((a, b) => (a.model > b.model) ? 1 : ((b.model > a.model) ? -1 : 0));
    const resp: Guitar[] = [];
    let i = 0;
    guitars.forEach(guitar => {
        if (i >= PAGE_SIZE * page && i < PAGE_SIZE * (page + 1)) {
            resp.push(guitar);
        }
        i++;
    });
    return resp;
}

async function getGuitarsLocal(customPrefix?: string): Promise<Guitar[]> {
    const keys: string[] = await LocalStorage.keys();
    const guitars = [];
    for (const i in keys) {
        const key = keys[i];
        if (key.startsWith(AppConstants.GUITARS)
            || (customPrefix && key.startsWith(`${customPrefix}/${AppConstants.GUITARS}`))) {
            const guitar: Guitar = await LocalStorage.get(key);
            guitars.push(guitar);
        }
    }
    return guitars;
}

function saveGuitarLocal(guitar: Guitar): Promise<Guitar> {
    if (!guitar?._id) {
        guitar._id = uuidv4();
        guitar.version = 0;
    }
    LocalStorage.set(`${AppConstants.GUITARS}/${guitar._id}`, guitar).then();
    return Promise.resolve(guitar);
}

async function deleteGuitarLocal(id: string, networkCall?: boolean): Promise<Guitar> {
    const key: string = `${AppConstants.GUITARS}/${id}`;
    let guitar: Guitar = await LocalStorage.get(key);
    if (!guitar) {
        guitar = await LocalStorage.get(`D/${key}`);
    }
    if (guitar) {
        LocalStorage.remove(key).then();
        if (!networkCall) {
            guitar.version = -1;
            LocalStorage.set(`D/${key}`, guitar).then();
        }
    }
    return guitar;
}

interface MessageData {
    type: string;
    payload: Guitar;
}

export const webSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
        console.log('web socket onopen');
        ws.send(JSON.stringify({type: 'authorization', payload: {token}}));
    };
    ws.onclose = () => {
        console.log('web socket onclose');
    };
    ws.onerror = error => {
        console.log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        console.log('web socket onmessage');
        const data: MessageData = JSON.parse(messageEvent.data);
        const {type, payload: item} = data;
        if (type === 'created' || type === 'updated') {
            saveGuitarLocal(item).then();
        } else if (type === 'deleted' && item._id) {
            deleteGuitarLocal(item._id, true).then();
        }
        onMessage(data);
    };
    return () => {
        ws.close();
    };
};
