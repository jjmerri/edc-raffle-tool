
import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';

import { DialogRef, ModalComponent, CloseGuard } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class SlotConfirmationModalContext extends BSModalContext {
    public comment: any;
    public callingComponent: any;
}

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
    selector: 'app-slot-confirmation',
    templateUrl: './slot-confirmation.modal.component.html'
})
export class SlotConfirmationModalComponent implements OnInit, ModalComponent<SlotConfirmationModalContext> {
    private context: SlotConfirmationModalContext;

    private unavailableSlots: any = [];

    private slotAssignment: any = {};

    constructor(public dialog: DialogRef<SlotConfirmationModalContext>) {
        this.context = dialog.context;
    }

    ngOnInit() {
        this.slotAssignment.username = this.context.comment.data.author;
        this.slotAssignment.randomSlots = 0;
    }

    private closeModal() {
        this.dialog.close();
    }

    private assignSlots() {
        this.dialog.close(this.slotAssignment);
    }

    private checkSlots(slotsToCheck: String) {
        this.unavailableSlots = [];

        if (slotsToCheck) {
            slotsToCheck = slotsToCheck.replace(/\s+/g, '');
            const calledSlots = slotsToCheck.split(',');
            for (let x = 0; x < calledSlots.length; x++) {
                if ( calledSlots[x] !== '') {
                    const calledSlot = +calledSlots[x];
                    if (!this.context.callingComponent.isSlotAvailable(calledSlot)) {
                        this.unavailableSlots.push(calledSlot);
                    }
                }
            }

        }
    }

}
