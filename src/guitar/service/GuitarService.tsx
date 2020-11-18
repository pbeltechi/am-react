import axios from 'axios';
import {Guitar} from "../Guitar";
import {AppConstants, baseUrl, httpConfig, noop, wsUrl} from "../../core/Utils";
import {LocalStorage} from '../../storage/Storage';
import {Plugins} from '@capacitor/core';

const {Network} = Plugins;

const {v4: uuidv4} = require('uuid');

const guitarUrl = `${baseUrl}/api/guitars`;

export const getAllGuitars: (token: string) => Promise<Guitar[]> = (token: string) => {
    return Network.getStatus()
        .then(status => {
            if (status.connected) {
                return axios.get<Guitar[]>(guitarUrl, httpConfig(token))
                    .then(
                        response => response.data,
                        () => getGuitarsLocal()
                    );
            }
            return getGuitarsLocal();
        });
};

export const getGuitars: (token: string, page: number, filter?: string, search?: string) => Promise<Guitar[]> =
    (token: string, page: number, filter?: string, search?: string) => {
        return Network.getStatus()
            .then(status => {
                if (status.connected) {
                    let url = `${guitarUrl}?page=${page}`;
                    if (filter && filter !== '') {
                        url += '&filter=' + filter;
                    }
                    if (search && search !== '') {
                        url += '&search=' + search;
                    }
                    return axios.get<Guitar[]>(url, httpConfig(token))
                        .then(response => {
                                const guitars = response.data;
                                guitars.forEach(guitar =>
                                    LocalStorage.set(`${AppConstants.GUITARS}/${guitar._id}`, guitar));
                                return guitars;
                            },
                            () => getGuitarsLocal()
                                .then(guitars => paginateAndMatch(guitars, page, filter, search))
                        );
                }
                return getGuitarsLocal().then(guitars => paginateAndMatch(guitars, page, filter, search));
            });
    };

export const getGuitar: (token: string, id: string) => Promise<Guitar> = (token: string, id: string) => {
    return Network.getStatus()
        .then(status => {
            if (status.connected) {
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
        });
};

export const insertGuitar: (guitar: Guitar, token: string) => Promise<Guitar> = (guitar, token) => {
    return Network.getStatus()
        .then(status => {
            if (status.connected) {
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
        });
};

export const updateGuitar: (guitar: Guitar, token: string) => Promise<Guitar> = (guitar, token) => {
    return Network.getStatus()
        .then(status => {
            if (status.connected) {
                const url = `${guitarUrl}/${guitar._id}`;
                axios.put<Guitar>(url, guitar, httpConfig(token))
                    .then(
                        response => {
                            saveGuitarLocal(guitar).then();
                            return response.data;
                        },
                        () => saveGuitarLocal(guitar)
                    );
            }
            return saveGuitarLocal(guitar);
        });
};

export const deleteGuitar: (id: string, token: string) => Promise<Guitar> = (id, token) => {
    return Network.getStatus()
        .then(status => {
            if (status.connected) {
                const url = `${guitarUrl}/${id}`;
                return axios.delete<Guitar>(url, httpConfig(token))
                    .then(
                        response => {
                            response.data?._id ? deleteGuitarLocal(response.data._id).then() : noop();
                            return response.data;
                        },
                        () => deleteGuitarLocal(id));
            }
            return deleteGuitarLocal(id);
        });
};

const PAGE_SIZE = 3;

function paginateAndMatch(guitars: Guitar[], page: number, filter?: string, search?: string): Guitar[] {
    if (filter) {
        guitars = guitars.filter(guitar => guitar.model === filter);
    }
    if (search) {
        guitars = guitars.filter(guitar => guitar.model.indexOf(search) >= 0);
    }
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

async function getGuitarsLocal(): Promise<Guitar[]> {
    const keys: string[] = await LocalStorage.keys();
    const guitars = [];
    for (const i in keys) {
        const key = keys[i];
        if (key.startsWith(AppConstants.GUITARS)) {
            const guitar: Guitar = await LocalStorage.get(key);
            guitars.push(guitar);
        }
    }
    return guitars;
}

function saveGuitarLocal(guitar: Guitar): Promise<Guitar> {
    if (!guitar?._id) {
        guitar._id = uuidv4();
    }
    LocalStorage.set(`${AppConstants.GUITARS}/${guitar._id}`, guitar).then();
    return Promise.resolve(guitar);
}

async function deleteGuitarLocal(id: string): Promise<Guitar> {
    const key: string = `${AppConstants.GUITARS}/${id}`;
    const guitar: Guitar = await LocalStorage.get(key);
    if (guitar) {
        LocalStorage.remove(key).then();
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
            deleteGuitarLocal(item._id).then();
        }
        onMessage(data);
    };
    return () => {
        ws.close();
    };
};
