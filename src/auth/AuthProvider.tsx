import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {loginApi} from './service/authApi';
import {LocalStorage} from '../storage/Storage';
import {AppConstants, noop} from '../core/Utils';


type LoginFn = (username?: string, password?: string) => any;

export interface AuthState {
    authenticationError: Error | null;
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    login?: LoginFn;
    logout?: () => void;
    pendingAuthentication?: boolean;
    username?: string;
    password?: string;
    token: string;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isAuthenticating: false,
    authenticationError: null,
    pendingAuthentication: false,
    token: '',
};

export const AuthContext = React.createContext<AuthState>(initialState);

interface AuthProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    useEffect(getInitialStateEffect, []);
    const [state, setState] = useState<AuthState>(initialState);
    const {isAuthenticated, isAuthenticating, authenticationError, pendingAuthentication, token} = state;
    const login = useCallback<LoginFn>(loginCallback, []);
    const logout = useCallback<() => void>(logoutCallback, []);
    useEffect(authenticationEffect, [pendingAuthentication]);
    const value = {isAuthenticated, login, logout, isAuthenticating, authenticationError, token};
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

    function loginCallback(username?: string, password?: string): void {
        setState({
            ...state,
            pendingAuthentication: true,
            username,
            password
        });
    }

    function logoutCallback(): void {
        LocalStorage.clear().then();
        setState(initialState);
    }

    function getInitialStateEffect() {
        console.log('getInitialStateEffect');
        let canceled = false;
        LocalStorage.get(AppConstants.TOKEN)
            .then(token =>
                token && !canceled
                    ? setState({
                        ...state,
                        token,
                        pendingAuthentication: false,
                        isAuthenticated: true,
                        authenticationError: null,
                        isAuthenticating: false,
                    })
                    : noop());
        return () => {
            canceled = true;
        };
    }

    function authenticationEffect() {
        let canceled = false;
        authenticate().then();
        return () => {
            canceled = true;
        };

        async function authenticate() {
            if (!pendingAuthentication) {
                return;
            }
            try {
                setState({
                    ...state,
                    isAuthenticating: true,
                });
                const {username, password} = state;
                const {token} = await loginApi(username, password);
                if (canceled) {
                    return;
                }
                console.log('authenticate succeeded', token);
                await LocalStorage.set(AppConstants.TOKEN, token);
                setState({
                    ...state,
                    token,
                    pendingAuthentication: false,
                    isAuthenticated: true,
                    isAuthenticating: false,
                });
            } catch (error) {
                if (canceled) {
                    return;
                }
                console.log('authenticate failed');
                setState({
                    ...state,
                    authenticationError: error,
                    pendingAuthentication: false,
                    isAuthenticating: false,
                });
            }
        }
    }
};
