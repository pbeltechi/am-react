import {Photo} from './Photo';

export interface Guitar {
    _id?: string;
    price: number;
    model: string;
    producedOn: Date;
    available: boolean;
    version: number;
    lastModified: Date;
    hasConflicts?: boolean
    photo?: Photo
    longitude?: number
    latitude?: number
}
