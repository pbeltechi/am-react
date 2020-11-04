import React, {useContext, useEffect, useState} from 'react';
import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCheckbox,
    IonCol,
    IonContent,
    IonDatetime,
    IonGrid,
    IonHeader,
    IonInput,
    IonLabel,
    IonLoading,
    IonPage,
    IonRow,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import './GuitarEdit.css';
import {RouteComponentProps} from "react-router";
import {GuitarContext} from "../GuitarProvider";
import {Guitar} from "../Guitar";

const GuitarEdit: React.FC<RouteComponentProps<{ id?: string }>> = ({history, match}) => {
    const {items, saving, savingError, saveItem, deletingError, deleting} = useContext(GuitarContext);
    const [item, setItem] = useState<Guitar>();
    const [model, setModel] = useState<string>('');
    const [price, setPrice] = useState<number>(0);
    const [producedOn, setProducedOn] = useState<string>(new Date().toString());
    const [available, setAvailable] = useState<boolean>(false);
    const isEditMode = match.params.id || false;
    useEffect(() => {
        const item = items?.find(it => it._id === match.params.id);
        setItem(item);
        if (item) {
            setModel(item.model);
            setPrice(item.price);
            setProducedOn(item.producedOn.toString());
            setAvailable(item.available);
        }
    }, [match.params.id, items]);
    const handleSave = () => {
        const editedItem = {...item, model, price, producedOn: new Date(), available};
        editedItem.producedOn = new Date(producedOn);
        saveItem && saveItem(editedItem).then(() => history.goBack());
    };
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/"/>
                    </IonButtons>
                    <IonTitle>{isEditMode ? 'Edit' : 'Add'} Guitar</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonCard>
                    <IonCardContent>
                        <IonGrid>
                            <IonRow class={'edit-row'}>
                                <IonCol><IonLabel>Model</IonLabel></IonCol>
                                <IonCol><IonInput value={model} className={'input'}
                                                  onIonChange={e => setModel(e.detail.value || '')}/></IonCol>
                            </IonRow>
                            <IonRow class={'edit-row'}>
                                <IonCol><IonLabel>Price</IonLabel></IonCol>
                                <IonCol><IonInput type="number" value={price} className={'input'}
                                                  onIonChange={e => setPrice(+(e.detail.value || 0))}/></IonCol>
                            </IonRow>
                            <IonRow class={'edit-row'}>
                                <IonCol><IonLabel>Produced on</IonLabel></IonCol>
                                <IonCol><IonDatetime
                                    className={'date-input'}
                                    displayFormat="D MMM YYYY H:mm"
                                    value={producedOn} onIonChange={e => setProducedOn(e.detail.value!)}/>
                                </IonCol>
                            </IonRow>
                            <IonRow class={'edit-row'}>
                                <IonCol><IonLabel>Available</IonLabel></IonCol>
                                <IonCol><IonCheckbox checked={available}
                                                     onIonChange={e => setAvailable(e.detail.checked)}/></IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonCardContent>
                </IonCard>
                <IonLoading isOpen={saving}/>
                {savingError && (
                    <div>{savingError.message || 'Failed to save item'}</div>
                )}
                <IonLoading isOpen={deleting}/>
                {deletingError && (
                    <div>{deletingError.message || 'Failed to save item'}</div>
                )}
                <div className={'button-container'}>
                    <IonButton className={'action-button'} onClick={handleSave}>Save</IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default GuitarEdit;
