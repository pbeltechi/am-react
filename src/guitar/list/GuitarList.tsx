import React, {useContext, useEffect, useState} from 'react';
import {
    createAnimation,
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
    IonImg,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonLabel,
    IonPage,
    IonRow,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToast,
    IonToolbar
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
    const {connectedNetworkStatus, settingsSavedOffline, setSettingsSavedOffline} = useContext(GuitarContext);
    const {conflictGuitars} = useContext(GuitarContext);
    const {token, logout} = useContext(AuthContext);
    const [models, setModels] = useState<string[]>([]);

    useEffect(getGuitarModels, [token, connectedNetworkStatus]);
    useEffect(conflictGuitarsEffect, [conflictGuitars]);
    useEffect(simpleAnimation, [items]);
    useEffect(groupedAnimation, [items]);

    function simpleAnimation() {
        const elems = document.querySelectorAll('.maps-link');
        if (elems) {
            elems.forEach(el =>
                createAnimation()
                    .addElement(el)
                    .duration(1000)
                    .direction('alternate')
                    .iterations(Infinity)
                    .keyframes([
                        {offset: 0, transform: 'translateX(0px)', opacity: '1'},
                        {offset: 1, transform: 'translateX(20px)', opacity: '0.8'}
                    ])
                    .play()
                    .then()
            );
        }
    }

    function groupedAnimation() {
        const el1 = document.querySelectorAll('.square-a');
        const el2 = document.querySelectorAll('.square-b');
        if (!el1 || !el2) {
            return;
        }
        for (let i = 0; i < el1.length && i < el2.length; i++) {
            const squareA = createAnimation()
                .addElement(el1[i])
                .keyframes([
                    {offset: 0, transform: 'rotate(0) scale(1)'},
                    {offset: 0.15, transform: 'rotate(180deg) scale(1.3)'},
                    {offset: 0.3, transform: 'rotate(360deg) scale(1)'},
                    {offset: 1, transform: 'rotate(360deg)'}
                ]);
            const squareB = createAnimation()
                .addElement(el2[i])
                .keyframes([
                    {offset: 0, transform: 'scale(1)'},
                    {offset: 0.15, transform: 'scale(1.2)'},
                    {offset: 0.3, transform: 'scale(1)'},
                ]);
            createAnimation()
                .duration(2000)
                .iterations(Infinity)
                .addAnimation([squareA, squareB])
                .play()
                .then();
        }
    }

    function conflictGuitarsEffect() {
        if (conflictGuitars && conflictGuitars.length > 0) {
            console.log('conflictGuitars', conflictGuitars);
            history.push('/guitars/conflict');
        }
    }

    function getGuitarModels() {
        fetchModels().then();
    }

    async function fetchModels() {
        const guitars: Guitar[] = await getAllGuitars(token, connectedNetworkStatus || false);
        const models = guitars.map(guitar => guitar.model);
        models.unshift('remove filter');
        const uniq = models.filter((item, pos) => models.indexOf(item) === pos);
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

    function searchChange(value: string) {
        setSearch ? setSearch(value) : noop();
        setItems ? setItems() : noop();
        setPage ? setPage(0) : noop();
    }

    const enterAnimation = (baseEl: any) => {
        const base = baseEl.querySelector('.toast-wrapper')!;
        const wrapperAnimation = createAnimation()
            .addElement(base)
            .keyframes([
                {offset: 0, opacity: '0', transform: 'translateY(100px)'},
                {offset: 1, opacity: '1', transform: 'translateX(6px) translateY(6px)'}
            ]);
        return createAnimation()
            .addElement(base)
            .easing('ease-out')
            .duration(1000)
            .addAnimation(wrapperAnimation);
    };

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction('reverse');
    };

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
                                        onDelete={id => {
                                            deleteItem ? deleteItem(id) : noop();
                                        }}/>
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
                <IonToast
                    isOpen={settingsSavedOffline ? settingsSavedOffline : false}
                    onDidDismiss={() => setSettingsSavedOffline ? setSettingsSavedOffline(false) : noop()}
                    message="Your settings have been saved locally since you're not connected to internet"
                    duration={2000}
                />
                <IonToast cssClass={'toast'}
                          enterAnimation={enterAnimation}
                          leaveAnimation={leaveAnimation}
                          isOpen={!connectedNetworkStatus || false}
                          position="top"
                          message="You are using this app in offline mode"
                />
                <IonToast
                    cssClass={'first-time-toast'}
                    isOpen={true}
                    message="Welcome back"
                    duration={10}
                />
            </IonContent>
        </IonPage>
    );
};

export default GuitarList;


export const GuitarItem: React.FC<{ guitar: Guitar, onEdit: (id?: string) => void, onDelete: (id?: string) => void }> = ({
                                                                                                                             guitar,
                                                                                                                             onEdit,
                                                                                                                             onDelete
                                                                                                                         }) => {
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
                        <IonCol class={'square-b'}>Available</IonCol>
                        <IonCol>
                            <IonCheckbox class={'square-a'} color="primary" disabled={true} checked={guitar.available}/>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol class={'edit-row'}>
                            <IonLabel>Photo</IonLabel>
                            <IonCheckbox disabled={true} class={'margin-left'} checked={!!guitar.photo}/>
                        </IonCol>
                        {guitar.photo &&
                        <IonCol size="6">
                            <IonImg src={guitar.photo.data}/>
                        </IonCol>
                        }
                    </IonRow>
                    {guitar.longitude && guitar.latitude &&
                    <IonRow>
                        <IonCol>
                            <div className={'maps-link'}>
                                <IonIcon className={'icon'}
                                         src={'https://www.flaticon.com/svg/static/icons/svg/57/57116.svg'}/>
                                <a href={`https://www.google.ro/maps/@${guitar.latitude},${guitar.longitude},8z`}
                                   target={'_blank'}>Guitar location</a>
                            </div>
                        </IonCol>
                    </IonRow>
                    }
                </IonGrid>
                <IonButton onClick={() => onDelete(guitar._id)} class={'action-button'}>Delete</IonButton>
            </IonCardContent>
        </IonCard>
    );
};

const GuitarItemDebug: React.FC<{ guitar: Guitar, onEdit: (id?: string) => void, onDelete: (id?: string) => void }> = ({
                                                                                                                           guitar,
                                                                                                                           onEdit,
                                                                                                                           onDelete
                                                                                                                       }) => {
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
