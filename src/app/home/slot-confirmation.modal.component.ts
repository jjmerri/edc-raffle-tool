
import { Component, OnInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

import { RedditService } from '../reddit/services/reddit.service';

export class SlotConfirmationModalContext extends BSModalContext {
    public comment: any;
    public callingComponent: any;
    public numOpenSlots: number;
}

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
    selector: 'app-slot-confirmation',
    templateUrl: './slot-confirmation.modal.component.html'
})
export class SlotConfirmationModalComponent implements OnInit, CloseGuard, ModalComponent<SlotConfirmationModalContext> {
    private static numOpenModals = 0;

    private context: SlotConfirmationModalContext;
    private unavailableSlots: any = [];
    private slotAssignments: any = [];
    private requestedTooManySlots = false;
    private hasDuplicateSlots = false;
    private numRequestedSlots = 0;
    private confirmationMessageText = '';
    private formattedMessage = '';

    constructor(public dialog: DialogRef<SlotConfirmationModalContext>, private redditService: RedditService) {
        this.context = dialog.context;
        dialog.setCloseGuard(this);
    }

    ngOnInit() {
        let txt: any;
        txt = document.createElement('temptxt');
        txt.innerHTML = decodeURI(this.context.comment.data.body_html);
        this.formattedMessage = txt.innerText;
        SlotConfirmationModalComponent.numOpenModals++;
        //only allow one open modal at a time
        if (SlotConfirmationModalComponent.numOpenModals === 1) {
            if (this.context.numOpenSlots > 0) {
                this.confirmationMessageText = 'You got {' + this.context.comment.data.author + '_ALL_SLOTS}';
            } else {
                this.confirmationMessageText = 'Waitlist starts here.';
            }

            this.slotAssignments[0] = {};
            this.slotAssignments[0].username = this.context.comment.data.author;
            this.slotAssignments[0].randomSlots = 0;
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

    private skipComment() {
        this.closeModal({slotAssignments: []});
    }

    private assignSlots() {
        this.closeModal({slotAssignments: this.slotAssignments, confirmationMessageText: this.confirmationMessageText});
    }

    private addSlotAssignment() {
        this.slotAssignments.push({randomSlots: 0});
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

        for (let i = 0; i < this.slotAssignments.length; i++) {
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
            this.numRequestedSlots += this.slotAssignments[i].randomSlots;
        }

        this.requestedTooManySlots = this.numRequestedSlots > this.context.numOpenSlots;
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

}
