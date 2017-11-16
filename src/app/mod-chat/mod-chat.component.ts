import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'app-mod-chat',
  templateUrl: './mod-chat.component.html',
  styleUrls: ['./mod-chat.component.css']
})
export class ModChatComponent implements OnInit {
    chatMessagesRef: AngularFireList<any>;
    chatMessages: Observable<any[]>;
    username = 'testName';
    msgVal = '';

    constructor(public afdb: AngularFireDatabase) {
        this.chatMessagesRef = afdb.list('/messages');
        this.chatMessages = this.chatMessagesRef.valueChanges();
    }

    chatSend(theirMessage: string) {
        this.chatMessagesRef.push({ message: theirMessage, name: this.username});
        this.msgVal = '';
    }

  ngOnInit() {
  }

}
