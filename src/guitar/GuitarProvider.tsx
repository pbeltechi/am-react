import React, {useCallback, useEffect, useReducer} from "react";
import {Guitar} from "./Guitar";
import PropTypes from 'prop-types';
import {deleteGuitar, getGuitars, saveGuitar, updateGuitar, webSocket} from "./service/GuitarService";
import {ItemsState} from "../core/Utils";

const guitarInitialState: ItemsState<Guitar> = {
    fetching: false,
    saving: false,
    deleting: false
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

const reducer: (state: ItemsState<Guitar>, action: { type: string, payload?: any }) => ItemsState<Guitar> =
    (state, {type, payload}) => {
        switch (type) {
            case FETCH_ITEMS_STARTED:
                return {...state, fetching: true, fetchingError: null};
            case FETCH_ITEMS_SUCCEEDED:
                return {...state, items: payload.data, fetching: false};
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
            default:
                return state;
        }
    }


export const GuitarProvider: React.FC<{ children: PropTypes.ReactNodeLike }> = ({children}) => {
    const [state, dispatch] = useReducer(reducer, guitarInitialState);
    const {items, fetching, fetchingError, saving, deleting, deletingError, savingError} = state;
    useEffect(getGuitarsEffect, []);
    useEffect(wsEffect, []);
    const saveItem = useCallback(saveGuitarCallback, []);
    const deleteItem = useCallback(deleteGuitarCallback, []);
    const value = {items, fetching, fetchingError, deleting, deletingError, saving, savingError, saveItem, deleteItem};
    return (
        <GuitarContext.Provider value={value}>
            {children}
        </GuitarContext.Provider>
    );

    function getGuitarsEffect() {
        let canceled = false;
        fetchGuitars().then();
        return () => {
            canceled = true;
        }

        async function fetchGuitars() {
            try {
                dispatch({type: FETCH_ITEMS_STARTED});
                const {data} = await getGuitars();
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
            const {data} = await (guitar._id ? updateGuitar(guitar) : saveGuitar(guitar));
            dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: data}});
        } catch (error) {
            dispatch({type: SAVE_ITEM_FAILED, payload: {error}});
        }
    }

    async function deleteGuitarCallback(id: string) {
        try {
            dispatch({type: DELETE_ITEM_STARTED});
            const {data} = await deleteGuitar(id);
            dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: data}});
        } catch (error) {
            dispatch({type: DELETE_ITEM_FAILED, payload: {error}});
        }
    }

    function wsEffect() {
        let canceled = false;
        console.log('wsEffect - connecting');
        let closeWebSocket: () => void;
        // if (token?.trim()) {
            closeWebSocket = webSocket(message => {
                if (canceled) {
                    return;
                }
                const { type, payload: item } = message;
                console.log(`ws message, item ${type}`);
                if (type === 'created' || type === 'updated') {
                    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: item}});
                } else if(type === 'deleted') {
                    dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: item}});
                }
            });
        // }
        return () => {
            console.log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }
};