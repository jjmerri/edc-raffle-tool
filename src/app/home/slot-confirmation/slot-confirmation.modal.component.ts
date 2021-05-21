import { Component, OnInit } from '@angular/core';
import { CloseGuard, DialogRef, ModalComponent } from 'ngx-modialog';
import { BSModalContext, Modal } from 'ngx-modialog/plugins/bootstrap';
import swal2 from 'sweetalert2';

import { RedditService } from '../../reddit/services/reddit.service';

export class SlotConfirmationModalContext extends BSModalContext {
  public comment: any;
  public raffle: any;
  public callingComponent: any;
  public numOpenSlots: number;
  public inOrderMode: boolean;
}

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
  selector: 'app-slot-confirmation',
  templateUrl: './slot-confirmation.modal.component.html',
  styleUrls: ['./slot-confirmation.modal.component.css'],
})
export class SlotConfirmationModalComponent
  implements OnInit, CloseGuard, ModalComponent<SlotConfirmationModalContext>
{
  private static numOpenModals = 0;

  public context: SlotConfirmationModalContext;
  private unavailableSlots: any = [];
  public slotAssignments: any = [];
  private requestedTooManySlots = false;
  private hasDuplicateSlots = false;
  private invalidRandom = false;
  private invalidinOrder = false;
  private slotAssignmentMissingSlots = false;
  public numRequestedSlots = 0;
  public confirmationMessageText = '';
  public formattedMessage = '';
  public isCommentFromBoyAndHisBlob = false;
  public isDonationComment = false;
  private donatedCommentSnippet =
    'I am donating a random slot to /u/BoyAndHisBlob as a thank you for creating and maintaining the Raffle Tool';
  private urlRegex = /\[?\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/gi;
  public linksInfo = [];

  constructor(
    public dialog: DialogRef<SlotConfirmationModalContext>,
    private redditService: RedditService,
    private modal: Modal,
  ) {
    this.context = dialog.context;
    dialog.setCloseGuard(this);
  }

  ngOnInit() {
    let txt: any;
    const userMentionRegex = /\/?u\/([a-zA-Z0-9_\-]{3,20})/gi;

    txt = document.createElement('temptxt');
    txt.innerHTML = this.context.comment.data.body_html;

    try {
      const urlMatches = this.context.comment.data.body.matchAll(this.urlRegex);
      if (this.context.raffle.title.toUpperCase().includes('GIVEAWAY')) {
        for (const match of urlMatches) {
          if (match[0].startsWith('[')) {
            continue;
          }
          const url = new URL(match[0]);

          if (url.host.includes('reddit.com')) {
            this.redditService.getSubmission(url.pathname + '.json').subscribe((getSubmissionResponse) => {
              const post = getSubmissionResponse[0].data.children[0].data;
              const comment = getSubmissionResponse[1].data.children[0].data;
              const userRegex = new RegExp(`[0-9]+ \/u\/${comment.author} \\*\\*PAID\\*\\*`);

              const parentIsPost = post.name === comment.parent_id;
              const postIsComplete = post.link_flair_text.toUpperCase() === 'COMPLETE';
              const userIsInRaffle = userRegex.test(post.selftext);
              const dateCommentCreated = new Date(comment.created_utc * 1000);
              const linkAuthorMatches = comment.author === this.context.comment.data.author;

              this.linksInfo.push({
                url: match[0],
                parentIsPost,
                postIsComplete,
                userIsInRaffle,
                dateCommentCreated,
                linkAuthorMatches,
              });
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    this.formattedMessage = txt.innerText;
    SlotConfirmationModalComponent.numOpenModals++;

    //only allow one open modal at a time
    if (SlotConfirmationModalComponent.numOpenModals === 1) {
      this.isDonationComment = this.context.comment.data.body.indexOf(this.donatedCommentSnippet) !== -1;
      this.isCommentFromBoyAndHisBlob = this.context.comment.data.author === 'BoyAndHisBlob';
      if (this.context.numOpenSlots > 0 || this.context.inOrderMode) {
        if (!this.isDonationComment) {
          this.confirmationMessageText = 'You got {' + this.context.comment.data.author + '_ALL_SLOTS}';
        } else {
          this.confirmationMessageText = 'BoyAndHisBlob got {BoyAndHisBlob_ALL_SLOTS}';
        }
      } else {
        this.confirmationMessageText = 'Waitlist starts here.';
      }

      if (!this.isDonationComment) {
        this.addSlotAssignment(this.context.comment.data.author);

        let match = userMentionRegex.exec(this.context.comment.data.body);
        while (match != null) {
          this.addSlotAssignment(match[1]);
          match = userMentionRegex.exec(this.context.comment.data.body);
        }
        if (this.context.numOpenSlots > 0 || this.context.inOrderMode) {
          this.confirmationMessageText += ['lego_raffles'].includes(this.context.comment.data.subreddit)
            ? '\n\n**Do not put any comments in your payment message or you will be permanently banned.**'
            : '';
          this.confirmationMessageText += ['WatchURaffle', 'raffleTest'].includes(this.context.comment.data.subreddit)
            ? '\n\n**Do not include any comments with your payment or you will be permanently banned.**'
            : '';
          if (!['FiftyFiftyToken'].includes(this.context.comment.data.subreddit)) {
            this.confirmationMessageText +=
              '\n\nIf you do not receive an automated PM from me then you can confirm your payment by filling in and sending [this PM]({PAYMENT_MESSAGE_LINK}).';
            this.confirmationMessageText +=
              "\n\nIf the above link doesn't work then try [this one]({IOS_PAYMENT_MESSAGE_LINK}).";
          }
        }
      } else {
        this.addSlotAssignment('BoyAndHisBlob');
      }
    } else {
      this.closeModal(null);
    }
  }
  beforeDismiss(): boolean {
    if (SlotConfirmationModalComponent.numOpenModals > 0) {
      SlotConfirmationModalComponent.numOpenModals--;
    }
    return false;
  }
  beforeClose(): boolean {
    if (SlotConfirmationModalComponent.numOpenModals > 0) {
      SlotConfirmationModalComponent.numOpenModals--;
    }
    return false;
  }

  public closeModal(result: any) {
    this.dialog.close(result);
  }

  private postWaitlistCommentAndClose() {
    this.redditService.postComment(this.confirmationMessageText, this.context.comment.data.name).subscribe();
    this.closeModal(null);
  }

  public skipComment(sendReplyMessage: boolean) {
    if (this.confirmationMessageText.indexOf('_ALL_SLOTS') === -1 || !sendReplyMessage) {
      if (sendReplyMessage) {
        this.redditService.postComment(this.confirmationMessageText, this.context.comment.data.name).subscribe();
      }
      this.closeModal({ slotAssignments: [] });
    } else {
      swal2(
        'Reply Not Written!',
        'It looks like you haven\'t changed the reply text. Please write your reply then click "Replay & Skip"',
        'error',
      );
    }
  }

  private assignSlots() {
    for (let x = 0; x < this.unavailableSlots.length; x++) {
      for (let i = 0; i < this.slotAssignments.length; i++) {
        const slotAssignment = this.slotAssignments[i];
        let slotArray = slotAssignment.calledSlots.split(',');
        const slotIndex = slotArray.indexOf(this.unavailableSlots[x].toString());

        if (slotIndex !== -1) {
          slotArray.splice(slotIndex, 1);
          slotAssignment.randomSlots++;
          slotAssignment.swappedSlots++;
          slotAssignment.calledSlots = slotArray.join(',');
        }
      }
    }
    this.closeModal({
      slotAssignments: this.slotAssignments,
      confirmationMessageText: this.confirmationMessageText,
    });
  }

  private addSlotAssignment(username?: string) {
    if (username && username !== this.context.comment.data.author && !this.isDonationComment) {
      let tagPrefix = '';
      if (
        this.context.comment.data.subreddit !== 'raffleTest' &&
        this.context.comment.data.subreddit !== 'testingground4bots'
      ) {
        tagPrefix = '/u/';
      }

      this.confirmationMessageText += '\n\n' + tagPrefix + username + ' got {' + username + '_ALL_SLOTS}';
    }

    this.slotAssignments.push({
      username: username,
      randomSlots: 0,
      calledSlots: '',
      inOrderSlots: 0,
      swappedSlots: 0,
      requester: this.context.comment.data.author,
      donateSlot: false,
    });
  }

  private removeSlotAssignment(index: number) {
    if (index >= 0 && index < this.slotAssignments.length) {
      const removedUser = this.slotAssignments[index].username;
      const isAuthor = removedUser === this.context.comment.data.author;
      const regexText = (isAuthor ? 'You' : '/u/' + removedUser) + ' got {' + removedUser + '_ALL_SLOTS}';
      const replyRegex = new RegExp(index === 0 ? regexText + '\n\n' : '\n\n' + regexText, 'i');
      this.confirmationMessageText = this.confirmationMessageText.replace(replyRegex, '');

      this.slotAssignments.splice(index, 1);
    }

    this.checkSlots();
  }

  private checkSlots() {
    this.unavailableSlots = [];
    const requestedSlots = [];
    this.numRequestedSlots = 0;
    this.hasDuplicateSlots = false;
    this.invalidRandom = false;
    this.invalidinOrder = false;
    this.slotAssignmentMissingSlots = false;

    for (let i = 0; i < this.slotAssignments.length; i++) {
      if (this.slotAssignments[i].randomSlots < 0) {
        this.invalidRandom = true;
      }

      if (this.slotAssignments[i].inOrderSlots < 0) {
        this.invalidinOrder = true;
      }

      if (this.slotAssignments[i].calledSlots) {
        this.slotAssignments[i].calledSlots = this.slotAssignments[i].calledSlots.replace(/[^0-9,]+/g, '');
      }
      const slotsToCheck = this.slotAssignments[i].calledSlots;
      if (slotsToCheck) {
        const calledSlots = slotsToCheck.split(',');
        for (let x = 0; x < calledSlots.length; x++) {
          if (calledSlots[x] !== '') {
            const calledSlot = +calledSlots[x];
            if (requestedSlots.indexOf(calledSlot) === -1) {
              requestedSlots.push(calledSlot);
            } else {
              this.hasDuplicateSlots = true;
            }
            this.numRequestedSlots++;
            if (!this.context.callingComponent.isSlotAvailable(calledSlot)) {
              this.unavailableSlots.push(calledSlot);
            }
          }
        }
      }

      if (
        !this.slotAssignments[i].calledSlots &&
        !this.slotAssignments[i].randomSlots &&
        !this.slotAssignments[i].inOrderSlots
      ) {
        this.slotAssignmentMissingSlots = true;
      }

      this.numRequestedSlots += this.slotAssignments[i].randomSlots + this.slotAssignments[i].inOrderSlots;
    }

    this.requestedTooManySlots = this.numRequestedSlots > this.context.numOpenSlots && !this.context.inOrderMode;
  }

  _keyPress(event: any) {
    const pattern = /[0-9\+,]/;
    let inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }

  private updateReplyText(event: any, index: number) {
    const updatedName = event.replace(new RegExp(' ', 'g'), '');
    this.confirmationMessageText = this.confirmationMessageText.replace(
      new RegExp('{' + this.slotAssignments[index].username + '_ALL_SLOTS' + '}', 'ig'),
      '{' + updatedName + '_ALL_SLOTS' + '}',
    );
    this.confirmationMessageText = this.confirmationMessageText.replace(
      new RegExp('{' + this.slotAssignments[index].username + '_CALLED_SLOTS' + '}', 'ig'),
      '{' + updatedName + '_ALL_SLOTS' + '}',
    );
    this.confirmationMessageText = this.confirmationMessageText.replace(
      new RegExp('{' + this.slotAssignments[index].username + '_RANDOM_SLOTS' + '}', 'ig'),
      '{' + updatedName + '_ALL_SLOTS' + '}',
    );
    this.confirmationMessageText = this.confirmationMessageText.replace(
      new RegExp('^/u/' + this.slotAssignments[index].username + ' got', 'igm'),
      '/u/' + updatedName + ' got',
    );
    this.slotAssignments[index].username = updatedName;
  }

  private donateSlot() {
    const commentText =
      '\n\nI am donating one of the requesed slots as a thank you for creating and maintaining the Raffle Tool.';
    this.modal
      .confirm()
      .title('Donate Slot?')
      .body(
        'This will assign the slot(s), mark one as paid, and add the below text to your confirmation reply. Thank you for donating!<br/><br/><i>' +
          commentText +
          '</i>',
      )
      .open()
      .then((dialogRef) => {
        dialogRef.result
          .then((result) => {
            if (result) {
              this.confirmationMessageText += commentText;
              for (let i = 0; i < this.slotAssignments.length; i++) {
                let slotAssignment = this.slotAssignments[i];
                if (slotAssignment.username === 'BoyAndHisBlob') {
                  slotAssignment.donateSlot = true;
                  break;
                }
              }

              this.assignSlots();
            }
          })
          .catch((error) => {});
      });
  }
}
