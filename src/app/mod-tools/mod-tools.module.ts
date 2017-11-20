import { NgModule} from '@angular/core';
import {ModToolsComponent} from './mod-tools.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ModChatModule } from '../mod-chat/mod-chat.module';
import { ModChatComponent } from '../mod-chat/mod-chat.component';
import { TimeAgoPipe } from 'time-ago-pipe';
import {SharedModule} from "../shared/shared.module";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        SharedModule],
    declarations: [ModToolsComponent],
    exports: [ModToolsComponent],
    entryComponents: []
})
export class ModToolsModule { }
