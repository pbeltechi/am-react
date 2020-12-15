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
    IonFab,
    IonFabButton,
    IonGrid,
    IonHeader,
    IonIcon,
    IonImg,
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
import {Photo} from '../Photo';
import {camera} from 'ionicons/icons';
import {useCamera} from '@ionic/react-hooks/camera';
import {CameraResultType, CameraSource, FilesystemDirectory} from '@capacitor/core';
import {base64FromPath, useFilesystem} from '@ionic/react-hooks/filesystem';
import {MyMap} from '../map/MyMap';


const GuitarEdit: React.FC<RouteComponentProps<{ id?: string }>> = ({history, match}) => {
    const {items, saving, savingError, saveItem, deletingError, deleting} = useContext(GuitarContext);
    const [item, setItem] = useState<Guitar>();
    const [model, setModel] = useState<string>('');
    const [price, setPrice] = useState<number>(0);
    const [producedOn, setProducedOn] = useState<string>(new Date().toString());
    const [available, setAvailable] = useState<boolean>(false);
    const [photo, setPhoto] = useState<Photo>();
    const isEditMode = match.params.id || false;
    const {writeFile} = useFilesystem();
    const [lat, setLat] = useState<number>(21);
    const [long, setLong] = useState<number>(45);

    const handleMapClick = (e: any) => {
        setLat(e.latLng.lat());
        setLong(e.latLng.lng());
    };

    useEffect(() => {
        const item = items?.find(it => it._id === match.params.id);
        if (item) {
            setItem(item);
            setModel(item.model);
            setPrice(item.price);
            setProducedOn(item.producedOn.toString());
            setAvailable(item.available);
            setPhoto(item.photo);
            if (item.longitude && item.latitude) {
                setLong(item.longitude);
                setLat(item.latitude);
            }
        }
    }, [match.params.id, items]);

    const handleSave = () => {
        const editedItem: any = {
            ...item,
            model,
            price,
            producedOn: new Date(),
            available,
            photo,
            latitude: lat,
            longitude: long
        };
        editedItem.producedOn = new Date(producedOn);
        saveItem && saveItem(editedItem).then(() => history.goBack());
    };

    function usePhotoGallery() {
        const {getPhoto} = useCamera();
        const takePhoto = async () => {
            const photo = await getPhoto({
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera,
                quality: 100
            });
            const fileName = new Date().getTime() + '.jpeg';
            const base64Data = await base64FromPath(photo.webPath!);
            const savedFile = await writeFile({
                path: fileName,
                data: base64Data,
                directory: FilesystemDirectory.Data
            });
            setPhoto({
                filepath: fileName,
                webviewPath: photo.webPath,
                data: base64Data
            });
        };

        return {
            takePhoto
        };
    }

    const {takePhoto} = usePhotoGallery();

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
                            <IonRow class={'edit-row'}>
                                <IonCol class={'edit-row'}>
                                    <IonLabel>Photo</IonLabel>
                                    <IonCheckbox disabled={true} class={'margin-left'} checked={!!photo}/>
                                </IonCol>
                                {photo &&
                                <IonCol size="6">
                                    <IonImg src={photo.data}/>
                                </IonCol>
                                }
                            </IonRow>
                            <IonRow>
                                <IonCol class={'edit-row'}>
                                    <IonLabel>Location</IonLabel>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol class={'edit-row'}>
                                    <IonLabel>Latitude</IonLabel>
                                </IonCol>
                                <IonCol>
                                    <IonInput type="number" value={lat} className={'input'}
                                              onIonChange={e => setLat(+(e.detail.value || 0))}/>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol class={'edit-row'}>
                                    <IonLabel>Longitude</IonLabel>
                                </IonCol>
                                <IonCol>
                                    <IonInput type="number" value={long} className={'input'}
                                              onIonChange={e => setLong(+(e.detail.value || 0))}/>
                                </IonCol>
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
                <div className={'map'}>
                    <MyMap
                        lat={lat}
                        lng={long}
                        onMapClick={(e: any) => handleMapClick(e)}
                    />
                </div>
                <div className={'button-container'}>
                    <IonButton className={'action-button'} onClick={handleSave}>Save</IonButton>
                </div>
                <IonFab vertical="bottom" horizontal="start" slot="fixed">
                    <IonFabButton color={'tertiary'} onClick={() => takePhoto()}>
                        <IonIcon icon={camera}/>
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default GuitarEdit;


// let item = items?.find(it => it._id === match.params.id);
// if (!item && match.params.id && getItem) {
//     getItem(match.params.id)
//         .then(() => {
//             setGuitar();
//         });
// } else {
//     setGuitar();
// }
