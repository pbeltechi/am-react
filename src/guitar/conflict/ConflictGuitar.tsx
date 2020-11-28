import React, {useContext, useEffect, useState} from 'react';
import {RouteComponentProps} from 'react-router';
import {GuitarContext} from '../GuitarProvider';
import {Guitar} from '../Guitar';
import './ConflictGuitar.css';
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
    IonGrid,
    IonHeader,
    IonLoading,
    IonPage,
    IonRow,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {dateFormat} from '../../core/Utils';

const ConflictGuitar: React.FC<RouteComponentProps> = ({history}) => {
    const {conflictGuitars} = useContext(GuitarContext);
    const {saving, savingError, saveItem} = useContext(GuitarContext);
    const [firstGuitar, setFirstGuitar] = useState<Guitar>();
    const [secondGuitar, setSecondGuitar] = useState<Guitar>();
    useEffect(setGuitarVs, []);

    function setGuitarVs() {
        if (!conflictGuitars || conflictGuitars?.length === 0) {
            // setConflictGuitars ? setConflictGuitars([]): noop();
            history.goBack();
            return;
        }
        setFirstGuitar(conflictGuitars[0]);
        setSecondGuitar(conflictGuitars[1]);
    }

    const handleSave = (guitar: Guitar) => {
        saveItem && saveItem(guitar).then(() => {
            conflictGuitars?.shift();
            conflictGuitars?.shift();
            setGuitarVs();
        });
    };
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Version conflicts</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {firstGuitar && (<GuitarConflictView guitar={firstGuitar} onAction={handleSave}/>)}
                <div className={'guitar-header'}>VS</div>
                {secondGuitar && (<GuitarConflictView guitar={secondGuitar} onAction={handleSave}/>)}
                <IonLoading isOpen={saving}/>
                {savingError && (
                    <div>{savingError.message || 'Failed to save item'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ConflictGuitar;


export const GuitarConflictView:
    React.FC<{ guitar: Guitar, onAction: (guitar: Guitar) => void }> =
    ({guitar, onAction}) => {
        return (
            <IonCard>
                <IonCardHeader className={'guitar-header'}>
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
                    <IonButton onClick={() => onAction(guitar)} class={'action-button'}>Accept this version</IonButton>
                </IonCardContent>
            </IonCard>
        );
    };
