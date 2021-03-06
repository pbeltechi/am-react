import React from 'react';
import {Redirect, Route} from 'react-router-dom';
import {IonApp, IonRouterOutlet} from '@ionic/react';
import {IonReactRouter} from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import GuitarList from "./guitar/list/GuitarList";
import GuitarEdit from "./guitar/edit/GuitarEdit";
import {GuitarProvider} from "./guitar/GuitarProvider";
import {AuthProvider, Login, PrivateRoute} from './auth';
import ConflictGuitar from './guitar/conflict/ConflictGuitar';

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <AuthProvider>
                    <Route path="/login" component={Login} exact={true}/>
                    <GuitarProvider>
                        <PrivateRoute path="/guitars/conflict" component={ConflictGuitar}/>
                        <PrivateRoute path="/guitars" component={GuitarList} exact={true}/>
                        <PrivateRoute path="/guitar" component={GuitarEdit} exact={true}/>
                        <PrivateRoute path="/guitar/:id" component={GuitarEdit}/>
                    </GuitarProvider>
                    <Route exact path="/" render={() => <Redirect to="/guitars"/>}/>
                </AuthProvider>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
