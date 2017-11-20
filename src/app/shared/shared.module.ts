import { NgModule} from '@angular/core';
import {ModChatModule} from "../mod-chat/mod-chat.module";
import {ModChatComponent} from "../mod-chat/mod-chat.component";
import {AsyncPipe, CommonModule} from "@angular/common";
import {TimeAgoPipe} from "time-ago-pipe";
import {FormsModule} from "@angular/forms";

@NgModule({
    imports: [ModChatModule, CommonModule, FormsModule],
    declarations: [ModChatComponent, TimeAgoPipe],
    exports: [ModChatComponent],
    entryComponents: [],
    providers: []
})
export class SharedModule { }
