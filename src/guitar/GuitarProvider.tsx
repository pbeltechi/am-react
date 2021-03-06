import React, {useCallback, useContext, useEffect, useReducer, useState} from "react";
import {Guitar} from "./Guitar";
import PropTypes from 'prop-types';
import {
    deleteGuitar,
    getGuitar,
    getGuitars,
    insertGuitar,
    syncData,
    updateGuitar,
    webSocket
} from "./service/GuitarService";
import {ItemsState} from "../core/Utils";
import {AuthContext} from '../auth';
import {Plugins} from '@capacitor/core';

const {Network} = Plugins;

const guitarInitialState: ItemsState<Guitar> = {
    fetching: false,
    saving: false,
    deleting: false,
    page: 0
};

export const GuitarContext = React.createContext<ItemsState<Guitar>>(guitarInitialState);

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';
const DELETE_ITEM_STARTED = 'DELETE_ITEM_STARTED';
const DELETE_ITEM_SUCCEEDED = 'DELETE_ITEM_SUCCEEDED';
const DELETE_ITEM_FAILED = 'DELETE_ITEM_FAILED';
const RESET_ITEMS = 'RESET_ITEMS';

const reducer: (state: ItemsState<Guitar>, action: { type: string, payload?: any }) => ItemsState<Guitar> =
    (state, {type, payload}) => {
        switch (type) {
            case FETCH_ITEMS_STARTED:
                return {...state, fetching: true, fetchingError: null};
            case FETCH_ITEMS_SUCCEEDED:
                const allItems: Guitar[] = [...state.items || []];
                payload.data
                    .forEach((item: Guitar) => {
                        const index = allItems.findIndex((it: Guitar) => it._id === item._id);
                        if (index === -1) {
                            allItems.push(item);
                        } else {
                            allItems[index] = item;
                        }
                    });
                return {...state, items: allItems, fetching: false, fetchingError: null};
            case FETCH_ITEMS_FAILED:
                return {...state, fetchingError: payload.error, fetching: false};
            case SAVE_ITEM_STARTED:
                return {...state, saving: true, savingError: null};
            case SAVE_ITEM_SUCCEEDED:
                const saveItems = state.items || [];
                const items = [...saveItems];
                const item = payload.item;
                const index = items.findIndex(it => it._id === item._id);
                if (index === -1) {
                    items.splice(0, 0, item);
                } else {
                    items[index] = item;
                }
                return {...state, items, saving: false};
            case SAVE_ITEM_FAILED:
                return {...state, savingError: payload.error, saving: false};
            case DELETE_ITEM_STARTED:
                return {...state, deleting: true, deletingError: null};
            case DELETE_ITEM_SUCCEEDED:
                const deletedItem = payload.item;
                const deletedIndex = (state.items || []).findIndex(it => it._id === deletedItem._id);
                if (deletedIndex > -1) {
                    (state?.items || []).splice(deletedIndex, 1);
                }
                return {...state, deletedItem, deleting: false};
            case DELETE_ITEM_FAILED:
                return {...state, deletingError: payload.error, deleting: false};
            case RESET_ITEMS:
                return {...state, items: []};
            default:
                return state;
        }
    };


export const GuitarProvider: React.FC<{ children: PropTypes.ReactNodeLike }> = ({children}) => {
    const [connectedNetworkStatus, setConnectedNetworkStatus] = useState<boolean>(false);
    Network.getStatus().then(status => setConnectedNetworkStatus(status.connected));
    const {token, isAuthenticated} = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, guitarInitialState);
    const {items, fetching, fetchingError, saving, deleting, deletingError, savingError} = state;
    const [page, setPage] = useState<number>(0);
    const [filter, setFilter] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [settingsSavedOffline, setSettingsSavedOffline] = useState<boolean>(false);
    const [conflictGuitars, setConflictGuitars] = useState<Guitar[]>([]);
    useEffect(getGuitarsEffect, [token, page, filter, search, connectedNetworkStatus]);
    useEffect(networkEffect, [token, setConflictGuitars, setConnectedNetworkStatus]);
    useEffect(wsEffect, [token, connectedNetworkStatus]);
    const saveItem = useCallback(saveGuitarCallback,
        [token, connectedNetworkStatus, setSettingsSavedOffline, setConflictGuitars]);
    // const getItems = useCallback(fetchGuitars, [token]);
    const setItems = useCallback(resetItemsCallback, []);
    const getItem = useCallback(getGuitarCallback, [token, connectedNetworkStatus]);
    const deleteItem = useCallback(deleteGuitarCallback, [token, connectedNetworkStatus, setSettingsSavedOffline]);
    const value = {
        items,
        setItems,
        fetching,
        fetchingError,
        deleting,
        deletingError,
        saving,
        savingError,
        getItem,
        // getItems,
        saveItem,
        deleteItem,
        setPage,
        page,
        search,
        setSearch,
        filter,
        setFilter,
        connectedNetworkStatus,
        settingsSavedOffline,
        setSettingsSavedOffline,
        conflictGuitars,
        // setConflictGuitars
    };
    return (
        <GuitarContext.Provider value={value}>
            {children}
        </GuitarContext.Provider>
    );

    function networkEffect() {
        let canceled = false;
        Network.addListener('networkStatusChange', async (status) => {
            if (canceled) {
                return;
            }
            const connected: boolean = status.connected;
            if (connected) {
                const conflicts = await syncData(token);
                setConflictGuitars(conflicts);
            }
            setConnectedNetworkStatus(connected);
            console.log("Network status changed", status);
        });
        return () => {
            canceled = true;
        };
    }

    function getGuitarsEffect() {
        let canceled = false;
        fetchGuitars().then();
        return () => {
            canceled = true;
        };

        async function fetchGuitars() {
            if (!isAuthenticated) {
                return;
            }
            try {
                dispatch({type: FETCH_ITEMS_STARTED});
                const data = await getGuitars(token, connectedNetworkStatus, page, filter, search);
                console.log('GetAll', data);
                if (!canceled) {
                    dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {data}});
                }
            } catch (error) {
                dispatch({type: FETCH_ITEMS_FAILED, payload: {error}});
            }
        }
    }

    async function saveGuitarCallback(guitar: Guitar) {
        try {
            dispatch({type: SAVE_ITEM_STARTED});
            const data = await (guitar._id
                ? updateGuitar(guitar, connectedNetworkStatus, token)
                : insertGuitar(guitar, connectedNetworkStatus, token));
            if (data.hasConflicts) {
                guitar.version = data.version;
                setConflictGuitars([guitar, data]);
                return;
            }
            dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: data}});
            if (!connectedNetworkStatus) {
                setSettingsSavedOffline(true);
            }
        } catch (error) {
            dispatch({type: SAVE_ITEM_FAILED, payload: {error}});
        }
    }

    async function getGuitarCallback(id: string) {
        try {
            dispatch({type: SAVE_ITEM_STARTED});
            const data = await getGuitar(token, connectedNetworkStatus, id);
            dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: data}});
        } catch (error) {
            dispatch({type: SAVE_ITEM_FAILED, payload: {error}});
        }
    }

    async function deleteGuitarCallback(id: string) {
        try {
            dispatch({type: DELETE_ITEM_STARTED});
            const data = await deleteGuitar(id, connectedNetworkStatus, token);
            dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: data}});
            if (!connectedNetworkStatus) {
                setSettingsSavedOffline(true);
            }
        } catch (error) {
            dispatch({type: DELETE_ITEM_FAILED, payload: {error}});
        }
    }

    function resetItemsCallback() {
        dispatch({type: RESET_ITEMS}); // used for search and filter
    }

    function wsEffect() {
        if (!connectedNetworkStatus || token === '') {
            return;
        }
        let canceled = false;
        console.log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = webSocket(token, message => {
                if (canceled) {
                    return;
                }
                const {type, payload: item} = message;
                console.log(`ws message, item ${type}`);
                if (type === 'created' || type === 'updated') {
                    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: item}});
                } else if (type === 'deleted') {
                    dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: item}});
                }
            });
        }
        return () => {
            console.log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        };
    }
};
