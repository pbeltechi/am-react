import React, {useContext} from 'react';
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {add} from 'ionicons/icons';
import './GuitarList.css';
import {GuitarContext} from "../../GuitarProvider";
import {Guitar} from "../../../core/Guitar";
import {RouteComponentProps} from "react-router";

const GuitarList: React.FC<RouteComponentProps> = ({history}) => {
    const {items, fetching, fetchingError} = useContext(GuitarContext);
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Guitars</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonLoading isOpen={fetching} message="Fetching items"/>
                {items && (
                    <IonList>
                        {items.map(item =>
                            <GuitarItem key={item._id} guitar={item} onEdit={id => history.push(`/guitar/${id}`)}/>
                        )}
                    </IonList>
                )}
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch items'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/guitar')}>
                        <IonIcon icon={add}/>
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default GuitarList;


const GuitarItem: React.FC<{ guitar: Guitar, onEdit: (id?: string) => void }> = ({guitar, onEdit}) => {
    return (
        <IonItem onClick={() => onEdit(guitar._id)}>
            <IonLabel>{guitar.model} {guitar.price} ({new Date(guitar.producedOn).toLocaleDateString()}) {String(guitar.available)}</IonLabel>
        </IonItem>
    );
};