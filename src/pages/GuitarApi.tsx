import axios, {AxiosResponse} from 'axios';
import {Guitar} from "../core/Guitar";
import {baseUrl, httpConfig, wsUrl} from "../core/Utils";

const guitarUrl = `${baseUrl}/api/guitars`;

export const getGuitars: () => Promise<AxiosResponse<Guitar[]>> = () => {
    return axios.get<Guitar[]>(guitarUrl, httpConfig());
}

export const saveGuitar: (guitar: Guitar) => Promise<AxiosResponse<Guitar>> = guitar => {
    return axios.post<Guitar>(guitarUrl, guitar, httpConfig());
}

export const updateGuitar: (guitar: Guitar) => Promise<AxiosResponse<Guitar>> = guitar => {
    const url = `${guitarUrl}/${guitar._id}`;
    return axios.put<Guitar>(url, guitar, httpConfig());
}

export const deleteGuitar: (id: string) => Promise<AxiosResponse<void>> = id => {
    const url = `${guitarUrl}/${id}`;
    return axios.delete<void>(url, httpConfig());
}

interface MessageData {
    type: string;
    payload: Guitar;
}


export const webSocket = (onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
        console.log('web socket onopen');
        // ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
    };
    ws.onclose = () => {
        console.log('web socket onclose');
    };
    ws.onerror = error => {
        console.log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        console.log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}