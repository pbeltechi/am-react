export const baseUrl = 'http://localhost:3000';
export const wsUrl = 'ws://localhost:3000'

export const httpConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
    }
});


export interface ItemsState<T> {
    items?: T,
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    deleting: boolean,
    deletingError?: Error | null,
    saveItem?: Function,
    deleteItem?: Function,
}