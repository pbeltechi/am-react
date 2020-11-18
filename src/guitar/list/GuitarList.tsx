import React, {useContext, useEffect, useState} from 'react';
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCheckbox,
    IonCol,
    IonContent,
    IonFab,
    IonFabButton,
    IonGrid,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonLabel,
    IonPage,
    IonRow,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
    useIonViewWillEnter
} from '@ionic/react';
import {add} from 'ionicons/icons';
import './GuitarList.css';
import {GuitarContext} from "../GuitarProvider";
import {Guitar} from "../Guitar";
import {RouteComponentProps} from "react-router";
import {dateFormat, noop} from "../../core/Utils";
import {AuthContext} from '../../auth';
import {getAllGuitars} from '../service/GuitarService';

const GuitarList: React.FC<RouteComponentProps> = ({history}) => {
    const {items, setItems, fetchingError, deleteItem, page, setPage, filter, setFilter, search, setSearch} =
        useContext(GuitarContext);
    const {token, logout} = useContext(AuthContext);
    const [models, setModels] = useState<string[]>([]);

    useEffect(getGuitarModels,[token]);

    function getGuitarModels() {
        fetchModels().then();
    }
    async function fetchModels() {
        const guitars: Guitar[] = await getAllGuitars(token);
        const models = guitars.map(guitar => guitar.model);
        models.unshift('remove filter');
        const uniq = models.filter((item, pos) => models.indexOf(item) == pos);
        setModels(uniq);
    }

    async function getNewItems($event: CustomEvent<void>) {
        console.log('page:', page);
        setPage ? setPage(page + 1) : noop();
        ($event.target as HTMLIonInfiniteScrollElement).complete().then();
    }

    function filterChange(value: string) {
        setFilter ? setFilter(value === 'remove filter' ? '' : value) : noop();
        setItems ? setItems() : noop();
        setPage ? setPage(0) : noop();
    }

    function searchChange(value: string){
        setSearch ? setSearch(value) : noop();
        setItems ? setItems() : noop();
        setPage ? setPage(0) : noop();
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButton slot="end" onClick={logout}>Log out</IonButton>
                    <IonTitle>Guitars</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonSelect value={filter} placeholder="Select model"
                           onIonChange={e => filterChange(e.detail.value)}>
                    {models.map((model, i) =>
                        <IonSelectOption key={i} value={model}>{model}</IonSelectOption>)}
                </IonSelect>
                <IonSearchbar
                    value={search}
                    debounce={1000}
                    onIonChange={e => searchChange(e.detail.value!)}>
                </IonSearchbar>
                {items && (
                    items.map(item =>
                            <GuitarItem key={item._id} guitar={item} onEdit={id => history.push(`/guitar/${id}`)}
                                        onDelete={id => deleteItem ? deleteItem(id) : noop()}/>
                        // <GuitarItemDebug key={item._id} guitar={item} onEdit={id => history.push(`/guitar/${id}`)}
                        // onDelete={id => deleteItem ? deleteItem(id) : noop()}/>
                    )
                )}
                <IonInfiniteScroll threshold="100px"
                                   onIonInfinite={(e: CustomEvent<void>) => getNewItems(e)}>
                    <IonInfiniteScrollContent
                        loadingText="Loading...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch items'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton className={'fab-button'} onClick={() => history.push('/guitar')}>
                        <IonIcon icon={add}/>
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default GuitarList;


export const GuitarItem: React.FC<{ guitar: Guitar, onEdit: (id?: string) => void, onDelete: (id?: string) => void }> = ({guitar, onEdit, onDelete}) => {
    return (
        <IonCard>
            <IonCardHeader className={'guitar-header'} onClick={() => onEdit(guitar._id)}>
                <IonCardSubtitle>Guitar Model</IonCardSubtitle>
                <IonCardTitle>{guitar.model}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <IonGrid>
                    <IonRow>
                        <IonCol>Price</IonCol>
                        <IonCol>${guitar.price}</IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>Date</IonCol>
                        <IonCol>{dateFormat(guitar.producedOn)}</IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>Available</IonCol>
                        <IonCol>
                            <IonCheckbox color="primary" disabled={true} checked={guitar.available}/>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <IonButton onClick={() => onDelete(guitar._id)} class={'action-button'}>Delete</IonButton>
            </IonCardContent>
        </IonCard>
    );
};

const GuitarItemDebug: React.FC<{ guitar: Guitar, onEdit: (id?: string) => void, onDelete: (id?: string) => void }> = ({guitar, onEdit, onDelete}) => {
    return (
        <div onClick={() => onEdit(guitar._id)}>
            <IonLabel>{guitar.model} {guitar.price} {dateFormat(guitar.producedOn)} {guitar.available}</IonLabel>
            <br/>
            <IonButton onClick={() => onDelete(guitar._id)}>Delete</IonButton>
        </div>
    );
};


// const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
// const [guitars, setGuitars] = useState<Guitar[]>([]);

// useEffect(setNewGuitarsEffect, [items]);

// function setNewGuitarsEffect() {
//     setPage(page + 1);
//     if (items) {
//         setDisableInfiniteScroll(items.length < 3);
//         console.log(items);
//         const allItems: Guitar[] = [...guitars];
//         items
//             .forEach((item: Guitar) => {
//                 const index = allItems.findIndex((it: Guitar) => it._id === item._id);
//                 if (index === -1) {
//                     allItems.push(item);
//                 } else {
//                     allItems[index] = item;
//                 }
//             });
//         setGuitars(allItems);
//     }
// }
