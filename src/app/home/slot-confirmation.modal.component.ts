
import { Component, OnInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class SlotConfirmationModalContext extends BSModalContext {
    public comment: any;
}

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
    selector: 'app-slot-confirmation',
    templateUrl: './slot-confirmation.modal.component.html'
})
export class SlotConfirmationModalComponent implements OnInit, ModalComponent<SlotConfirmationModalContext> {
    context: SlotConfirmationModalContext;

    private slotAssignment: any = {};

    constructor(public dialog: DialogRef<SlotConfirmationModalContext>) {
        this.context = dialog.context;
    }

    ngOnInit() {
        console.log(this.context.comment);
    }

    private closeModal() {
        this.dialog.close();
    }

    private assignSlot() {
        this.dialog.close(this.slotAssignment);
    }

}
