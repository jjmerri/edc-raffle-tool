
import { Component, OnInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'ngx-modialog';
import { Modal, BSModalContext } from 'ngx-modialog/plugins/bootstrap';

import swal from 'sweetalert2';

import { RedditService } from '../reddit/services/reddit.service';

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
    private static waitlistMessageSent = false;

    private context: SlotConfirmationModalContext;
    private unavailableSlots: any = [];
    private slotAssignments: any = [];
    private requestedTooManySlots = false;
    private hasDuplicateSlots = false;
    private invalidRandom = false;
    private invalidinOrder = false;
    private numRequestedSlots = 0;
    private confirmationMessageText = '';
    private formattedMessage = '';
    private isCommentFromBoyAndHisBlob = false;

    constructor(public dialog: DialogRef<SlotConfirmationModalContext>, private redditService: RedditService, private modal: Modal) {
        this.context = dialog.context;
        dialog.setCloseGuard(this);
    }

    ngOnInit() {
        let txt: any;
        txt = document.createElement('temptxt');
        txt.innerHTML = this.context.comment.data.body_html;
        this.formattedMessage = txt.innerText;
        SlotConfirmationModalComponent.numOpenModals++;
        //only allow one open modal at a time
        if (SlotConfirmationModalComponent.numOpenModals === 1) {
            this.isCommentFromBoyAndHisBlob = this.context.comment.data.author === 'BoyAndHisBlob';
            if (this.context.numOpenSlots > 0 || this.context.inOrderMode) {
                this.confirmationMessageText = 'You got {' + this.context.comment.data.author + '_ALL_SLOTS}';
            } else {
                this.confirmationMessageText = 'Waitlist starts here.';
            }

            this.slotAssignments[0] = {};
            this.slotAssignments[0].username = this.context.comment.data.author;
            this.slotAssignments[0].rquester = this.context.comment.data.author;
            this.slotAssignments[0].randomSlots = 0;
            this.slotAssignments[0].inOrderSlots = 0;
            this.slotAssignments[0].swappedSlots = 0;
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
        SlotConfirmationModalComponent.waitlistMessageSent = true;
        this.closeModal(null);
    }

    private skipComment() {
        this.closeModal({slotAssignments: []});
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

    private addSlotAssignment() {
        this.slotAssignments.push({randomSlots: 0, inOrderSlots: 0, swappedSlots: 0, requester: this.context.comment.data.author});
    }

    private removeSlotAssignment(index: number) {
        if (index >= 0 && index < this.slotAssignments.length) {
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

        for (let i = 0; i < this.slotAssignments.length; i++) {
            if (this.slotAssignments[i].randomSlots < 0) {
                this.invalidRandom = true;
            }

            if (this.slotAssignments[i].inOrderSlots < 0) {
                this.invalidinOrder = true;
            }

            let slotsToCheck = this.slotAssignments[i].calledSlots;
            if (slotsToCheck) {
                slotsToCheck = slotsToCheck.replace(/\s+/g, '');
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

    public get waitlistMessageSent() {
        return SlotConfirmationModalComponent.waitlistMessageSent;
    }

}
