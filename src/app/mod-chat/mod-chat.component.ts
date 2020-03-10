import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as jQuery from 'jquery';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-mod-chat',
  templateUrl: './mod-chat.component.html',
  styleUrls: ['./mod-chat.component.css']
})
export class ModChatComponent implements OnInit {
  @ViewChild('chatScroll', { static: false })
  private myScrollContainer: ElementRef;

  @Output() messageEventEmitter = new EventEmitter();

  @Input() modToolsId = '';
  @Input() username = '';
  @Input() userRole = 'MOD';

  private chatMessagesRef: any;
  private chatMessages: Observable<any[]>;
  private msgVal = '';
  public showNewMessageText = false;

  constructor(private afdb: AngularFirestore) {}

  ngOnInit() {
    this.chatMessagesRef = this.afdb.collection(
      '/mod_tools/' + this.modToolsId + '/messages'
    );
    this.chatMessages = this.chatMessagesRef.valueChanges();
    this.chatMessages.subscribe(updatedMessages => {
      this.messageEventEmitter.emit(updatedMessages);

      setTimeout(() => {
        this.scrollToBottom();
      }, 250);

      if (jQuery('#collapseOne').attr('aria-expanded') === 'false') {
        this.showNewMessageText = true;
      }
    });
  }

  private scrollToBottom() {
    let panel: any = document.getElementsByName('chatBody')[0];

    if (panel) {
      panel.scrollTop = panel.scrollHeight;
    }
  }

  private chatSend(message: string) {
    if (message) {
      this.chatMessagesRef.push({
        message: message,
        username: this.username,
        userRole: this.userRole,
        timeSent: Date.now()
      });
      this.msgVal = '';
    }
  }

  private updateUsername(updatedUsername: string) {
    if (updatedUsername) {
      this.username = updatedUsername;
      setTimeout(() => {
        this.scrollToBottom();
      }, 250);
    }
  }

  public collapse() {
    this.showNewMessageText = false;

    setTimeout(() => {
      this.scrollToBottom();
    }, 250);
  }
}
