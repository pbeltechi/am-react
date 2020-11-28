import moment from "moment";
import {Guitar} from '../guitar/Guitar';

export const baseUrl = 'http://localhost:3000';
export const wsUrl = 'ws://localhost:3000';

export const httpConfig = (token?: string) => ({
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
});


export interface ItemsState<T> {
    items?: T[],
    setItems?: Function
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    deleting: boolean,
    deletingError?: Error | null,
    saveItem?: Function,
    getItems?: Function,
    getItem?: (id: string) => Promise<void>,
    deleteItem?: Function,
    setPage?: Function
    page: number
    search?: string
    setSearch?: Function
    filter?: string
    setFilter? :Function,
    connectedNetworkStatus?: boolean
    setSettingsSavedOffline?: Function,
    settingsSavedOffline?: boolean
    conflictGuitars?: Guitar[];
    setConflictGuitars?: Function
}

export const dateFormat = (date: Date) => {
    return moment(date).format("LL");
};

export const noop = () => {
};

export class AppConstants {
    static readonly TOKEN = 'token';
    static readonly GUITARS = 'guitars';
}
