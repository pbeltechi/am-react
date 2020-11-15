import axios from 'axios';
import {baseUrl, httpConfig} from '../core/Utils';

const authUrl = `${baseUrl}/api/auth/login`;

export interface AuthProps {
  token: string;
}

export const loginApi: (username?: string, password?: string) => Promise<AuthProps> = (username, password) => {
  return axios.post(authUrl, { username, password }, httpConfig())
      .then(res => Promise.resolve(res.data));
}
