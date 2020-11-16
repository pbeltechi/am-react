import axios from 'axios';
import {Guitar} from "../Guitar";
import {AppConstants, baseUrl, httpConfig, noop, wsUrl} from "../../core/Utils";
import {Plugins} from '@capacitor/core';
import {LocalStorage} from '../../storage/Storage';

const {v4: uuidv4} = require('uuid');
const {Network} = Plugins;

const guitarUrl = `${baseUrl}/api/guitars`;

export const getGuitars: (token: string, page: number) => Promise<Guitar[]> = (token: string, page: number) => {
    return Network.getStatus()
        .then(status => {
            if (status.connected) {
                const url = `${guitarUrl}?page=${page}`;
                return axios.get<Guitar[]>(url, httpConfig(token))
                    .then(response => {
                        LocalStorage.set(AppConstants.GUITARS, response.data).then();
                        return response.data;
                    });
            }
            return LocalStorage.get(AppConstants.GUITARS);
        });
};

export const insertGuitar: (guitar: Guitar, token: string) => Promise<Guitar> = (guitar, token) => {
    return Network.getStatus()
        .then(status => {
            if (status.connected) {
                return axios.post<Guitar>(guitarUrl, guitar, httpConfig(token))
                    .then(response => {
                        saveGuitarLocal(response.data).then();
                        return response.data;
                    });
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
                    .then(response => {
                        saveGuitarLocal(guitar).then();
                        return response.data;
                    });
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
                    .then(response => {
                        response.data?._id ? deleteGuitarLocal(response.data._id).then() : noop();
                        return response.data;
                    });
            }
            return deleteGuitarLocal(id);
        });
};

function saveGuitarLocal(guitar: Guitar): Promise<Guitar> {
    return LocalStorage.get(AppConstants.GUITARS)
        .then((guitars: Guitar[]) => {
            const index = guitars.findIndex(it => it._id === guitar?._id);
            if (index === -1) {
                guitars.splice(0, 0, guitar);
                if (!guitar?._id) {
                    guitar._id = uuidv4();
                }
            } else {
                guitars[index] = guitar;
            }
            LocalStorage.set(AppConstants.GUITARS, guitars).then();
            return guitar;
        });
}

function deleteGuitarLocal(id: string): Promise<Guitar> {
    return LocalStorage.get(AppConstants.GUITARS)
        .then((guitars: Guitar[]) => {
            const deletedIndex = guitars.findIndex(it => it._id === id);
            const guitar = guitars[deletedIndex];
            if (deletedIndex > -1) {
                guitars.splice(deletedIndex, 1);
            }
            LocalStorage.set(AppConstants.GUITARS, guitars).then();
            return guitar;
        });
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
