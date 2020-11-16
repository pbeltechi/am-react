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
    IonList,
    IonLoading,
    IonPage,
    IonRow,
    IonTitle,
    IonToolbar, useIonViewWillEnter
} from '@ionic/react';
import {add} from 'ionicons/icons';
import './GuitarList.css';
import {GuitarContext} from "../GuitarProvider";
import {Guitar} from "../Guitar";
import {RouteComponentProps} from "react-router";
import {dateFormat, noop} from "../../core/Utils";
import {AuthContext} from '../../auth';

const GuitarList: React.FC<RouteComponentProps> = ({history}) => {
    const {items, fetching, fetchingError, deleteItem, page, setPage} = useContext(GuitarContext);
    const [guitars, setGuitars] = useState<Guitar[]>([]);
    const {logout} = useContext(AuthContext);
    useEffect(setNewGuitarsEffect,[items]);

    function setNewGuitarsEffect() {
        setGuitars([...guitars, ...items || []]);
    }

    function getNewItems($event: CustomEvent<void>) {
        if(setPage){
            setPage(page +1);
        }
        console.log($event);
        ($event.target as HTMLIonInfiniteScrollElement).complete().then();
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
                {guitars && (
                    guitars.map(item =>
                                <GuitarItem key={item._id} guitar={item} onEdit={id => history.push(`/guitar/${id}`)}
                                            onDelete={id => deleteItem ? deleteItem(id) : noop()}/>
                            // <GuitarItemDebug key={item._id} guitar={item} onEdit={id => history.push(`/guitar/${id}`)}
                            // onDelete={id => deleteItem ? deleteItem(id) : noop()}/>
                        )
                )}
                <IonInfiniteScroll threshold="100px"
                                   onIonInfinite={(e: CustomEvent<void>) => getNewItems(e)}>
                    <IonInfiniteScrollContent
                        loadingText="Loading more good doggos...">
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


const GuitarItem: React.FC<{ guitar: Guitar, onEdit: (id?: string) => void, onDelete: (id?: string) => void }> = ({guitar, onEdit, onDelete}) => {
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
