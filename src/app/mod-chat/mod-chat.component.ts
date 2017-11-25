import {AfterViewChecked, Component, ElementRef, EventEmitter, Input, Output, OnInit, ViewChild} from '@angular/core';
import {AngularFireDatabase, AngularFireList} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';

@Component({
    selector: 'app-mod-chat',
    templateUrl: './mod-chat.component.html',
    styleUrls: ['./mod-chat.component.css']
})
export class ModChatComponent implements OnInit, AfterViewChecked {
    @ViewChild('chatScroll') private myScrollContainer: ElementRef;

    @Output() messageEventEmitter = new EventEmitter();

    @Input() modToolsId = '';
    @Input() username = '';
    @Input() userRole = 'MOD';

    chatMessagesRef: AngularFireList<any>;
    chatMessages: Observable<any[]>;
    msgVal = '';

    constructor(private afdb: AngularFireDatabase) {
    }

    ngOnInit() {
        this.chatMessagesRef = this.afdb.list('/mod_tools/' + this.modToolsId + '/messages');
        this.chatMessages = this.chatMessagesRef.valueChanges();
        this.chatMessages.subscribe(updatedMessages => {
            this.messageEventEmitter.emit(updatedMessages);
        });
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    private scrollToBottom() {
        let panel: any = document.getElementsByName('chatBody')[0];

        if (panel) {
            panel.scrollTop = panel.scrollHeight;
        }
    }

    chatSend(message: string) {
        if (message) {
            this.chatMessagesRef.push({message: message, username: this.username, userRole: this.userRole, timeSent: Date.now()});
            this.msgVal = '';
        }
    }

    updateUsername(updatedUsername: string) {
        if (updatedUsername) {
            this.username = updatedUsername;
        }
    }

}
