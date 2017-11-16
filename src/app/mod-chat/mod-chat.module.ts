import { NgModule} from '@angular/core';
import {environment} from 'environments/environment';
import { AngularFireModule } from 'angularfire2';
import {AngularFireDatabase} from 'angularfire2/database';

export const firebaseConfig = {
    apiKey: environment.firebaseApiKey,
    authDomain: environment.firebaseAuthDomain,
    databaseURL: environment.firebaseDatabaseUrl,
    storageBucket: environment.firebaseStorageBucket,
    messagingSenderId: environment.firebaseSenderId
};

@NgModule({
    imports: [
        AngularFireModule.initializeApp(firebaseConfig)],
    declarations: [],
    exports: [],
    entryComponents: [],
    providers: [AngularFireDatabase]
})
export class ModChatModule { }
