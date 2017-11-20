import { NgModule} from '@angular/core';
import {environment} from 'environments/environment';
import { AngularFireModule } from 'angularfire2';
import {AngularFireDatabase} from 'angularfire2/database';
import {CommonModule} from "@angular/common";
import {AsyncPipe} from '@angular/common';

export const firebaseConfig = {
    apiKey: environment.firebaseApiKey,
    authDomain: environment.firebaseAuthDomain,
    databaseURL: environment.firebaseDatabaseUrl,
    storageBucket: environment.firebaseStorageBucket,
    messagingSenderId: environment.firebaseSenderId
};

@NgModule({
    imports: [
        AngularFireModule.initializeApp(firebaseConfig), CommonModule],
    declarations: [],
    exports: [],
    entryComponents: [],
    providers: [AngularFireDatabase]
})
export class ModChatModule { }
