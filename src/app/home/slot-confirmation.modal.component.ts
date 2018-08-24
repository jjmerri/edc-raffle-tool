
import { Component, OnInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'ngx-modialog';
import { Modal, BSModalContext } from 'ngx-modialog/plugins/bootstrap';

import { RedditService } from '../reddit/services/reddit.service';

import swal2 from 'sweetalert2';

export class SlotConfirmationModalContext extends BSModalContext {
    public comment: any;
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
    styleUrls: ['./slot-confirmation.modal.component.css']
})
export class SlotConfirmationModalComponent implements OnInit, CloseGuard, ModalComponent<SlotConfirmationModalContext> {
    private static numOpenModals = 0;

    private context: SlotConfirmationModalContext;
    private unavailableSlots: any = [];
    private slotAssignments: any = [];
    private requestedTooManySlots = false;
    private hasDuplicateSlots = false;
    private invalidRandom = false;
    private invalidinOrder = false;
    private slotAssignmentMissingSlots = false;
    private numRequestedSlots = 0;
    private confirmationMessageText = '';
    private formattedMessage = '';
    private isCommentFromBoyAndHisBlob = false;
    private isDonationComment = false;
    private donatedCommentSnippet = 'I am donating a random slot to /u/BoyAndHisBlob as a thank you for creating and maintaining the Raffle Tool';

    constructor(public dialog: DialogRef<SlotConfirmationModalContext>, private redditService: RedditService, private modal: Modal) {
        this.context = dialog.context;
        dialog.setCloseGuard(this);
    }

    ngOnInit() {
        let txt: any;
        const userMentionRegex = /\/?u\/([a-zA-Z0-9_\-]{3,20})/gi;

        txt = document.createElement('temptxt');
        txt.innerHTML = this.context.comment.data.body_html;
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

    private closeModal(result: any) {
        this.dialog.close(result);
    }

    private postWaitlistCommentAndClose() {
        this.redditService.postComment(this.confirmationMessageText, this.context.comment.data.name).subscribe();
        this.closeModal(null);
    }

    private skipComment(sendReplyMessage: boolean) {
        if (this.confirmationMessageText.indexOf('_ALL_SLOTS') === -1 || !sendReplyMessage) {
            if (sendReplyMessage) {
                this.redditService.postComment(this.confirmationMessageText, this.context.comment.data.name).subscribe();
            }
            this.closeModal({slotAssignments: []});
        } else {
            swal2('Reply Not Written!',
                'It looks like you haven\'t changed the reply text. Please write your reply then click "Replay & Skip"',
                'error'
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
        this.closeModal({slotAssignments: this.slotAssignments, confirmationMessageText: this.confirmationMessageText});
    }

    private addSlotAssignment(username?: string) {
        if (username && username !== this.context.comment.data.author && !this.isDonationComment) {
            let tagPrefix = '';
            if (this.context.comment.data.subreddit !== 'raffleTest' && this.context.comment.data.subreddit !== 'testingground4bots') {
                tagPrefix = '/u/';
            }

            this.confirmationMessageText += '\n\n' + tagPrefix + username + ' got {' + username + '_ALL_SLOTS}';
        }

        this.slotAssignments.push(
            {   username: username,
                randomSlots: 0,
                calledSlots: '',
                inOrderSlots: 0,
                swappedSlots: 0,
                requester: this.context.comment.data.author
            });
    }

    private removeSlotAssignment(index: number) {
        if (index >= 0 && index < this.slotAssignments.length) {
            const removedUser = this.slotAssignments[index].username;
            const isAuthor = removedUser === this.context.comment.data.author;
            const regexText = (isAuthor ? 'You' : '/u/' + removedUser) + ' got {' + removedUser + '_ALL_SLOTS}';
            const replyRegex = new RegExp((index === 0 ? regexText + '\n\n' : '\n\n' + regexText), 'i');
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
                    if ( calledSlots[x] !== '') {
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

            if (!this.slotAssignments[i].calledSlots && !this.slotAssignments[i].randomSlots && !this.slotAssignments[i].inOrderSlots) {
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
        this.confirmationMessageText = this.confirmationMessageText.replace(new RegExp('{' + this.slotAssignments[index].username + '_ALL_SLOTS' + '}', 'ig'),
            '{' + updatedName + '_ALL_SLOTS' + '}');
        this.confirmationMessageText = this.confirmationMessageText.replace(new RegExp('{' + this.slotAssignments[index].username + '_CALLED_SLOTS' + '}', 'ig'),
            '{' + updatedName + '_ALL_SLOTS' + '}');
        this.confirmationMessageText = this.confirmationMessageText.replace(new RegExp('{' + this.slotAssignments[index].username + '_RANDOM_SLOTS' + '}', 'ig'),
            '{' + updatedName + '_ALL_SLOTS' + '}');
        this.confirmationMessageText = this.confirmationMessageText.replace(new RegExp('^/u/' + this.slotAssignments[index].username + ' got', 'igm'),
            '/u/' + updatedName + ' got');
        this.slotAssignments[index].username = updatedName;
    }

    private donateSlot() {
        const commentText = '\n\nI am donating one of the requesed slots as a thank you for creating and maintaining the Raffle Tool.';
        this.modal.confirm()
            .title('Donate Slot?')
            .body('This will assign the slot(s), mark one as paid, and add the below text to your confirmation reply. Thank you for donating!<br/><br/><i>' + commentText + '</i>')
            .open().then( dialogRef => {
            dialogRef.result.then(result => {
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
            }).catch(error => {});
        });
    }

}
