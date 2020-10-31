import React, {useContext, useEffect, useState} from 'react';
import {
    IonButton,
    IonCheckbox,
    IonContent,
    IonDatetime,
    IonHeader,
    IonInput,
    IonLabel,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import './EditGuitar.css';
import {RouteComponentProps} from "react-router";
import {GuitarContext} from "../../GuitarProvider";
import {Guitar} from "../../../core/Guitar";

const EditGuitar: React.FC<RouteComponentProps<{ id?: string }>> = ({history, match}) => {
    const {items, saving, savingError, saveItem, deleteItem, deletingError, deleting} = useContext(GuitarContext);
    const [item, setItem] = useState<Guitar>();
    const [model, setModel] = useState<string>('');
    const [price, setPrice] = useState<number>(0);
    const [producedOn, setProducedOn] = useState<string>(new Date().toString());
    const [available, setAvailable] = useState<boolean>(false);
    const showDeleteButton = match.params.id || false;
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
    const handleDelete = () => {
        deleteItem && deleteItem(match.params.id).then(() => history.goBack());
    };
    return (
        <IonPage>
            <IonHeader collapse="condense">
                <IonToolbar>
                    <IonTitle size="large">Edit guitar</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>

                <IonLabel>model:</IonLabel>
                <IonInput value={model} onIonChange={e => setModel(e.detail.value || '')}/>
                <IonLabel>price:</IonLabel>
                <IonInput type="number" value={price} onIonChange={e => setPrice(+(e.detail.value || 0))}/>
                <IonLabel>producedOn:</IonLabel>
                <IonDatetime
                    displayFormat="D MMM YYYY H:mm"
                    value={producedOn} onIonChange={e => setProducedOn(e.detail.value!)}
                />
                <IonLabel>available:</IonLabel>
                <IonCheckbox checked={available} onIonChange={e => setAvailable(e.detail.checked)}/>
                <br/>
                <IonLoading isOpen={saving}/>
                {savingError && (
                    <div>{savingError.message || 'Failed to save item'}</div>
                )}
                <IonButton onClick={handleSave}>Save</IonButton>
                {showDeleteButton && deleteItem && (<IonButton onClick={handleDelete}>Delete</IonButton>)}
                <IonLoading isOpen={deleting}/>
                {deletingError && (
                    <div>{deletingError.message || 'Failed to save item'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default EditGuitar;
