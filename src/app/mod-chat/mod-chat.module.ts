import { NgModule} from '@angular/core';
import {environment} from 'environments/environment';
import { AngularFireModule } from 'angularfire2';
import {AngularFireDatabase} from 'angularfire2/database';
import {CommonModule} from "@angular/common";
import {AsyncPipe} from '@angular/common';

@NgModule({
    imports: [CommonModule],
    declarations: [],
    exports: [],
    entryComponents: [],
    providers: [AngularFireDatabase]
})
export class ModChatModule { }
