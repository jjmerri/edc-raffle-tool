
import { Component } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class SlotConfirmationModalContext extends BSModalContext {
    public num1: number;
    public num2: number;
}

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
    selector: 'app-slot-confirmation',
    templateUrl: './slot-confirmation.modal.component.html'
})
export class SlotConfirmationModalComponent implements CloseGuard, ModalComponent<SlotConfirmationModalContext> {
    context: SlotConfirmationModalContext;

    public wrongAnswer: boolean;
    public shouldUseMyClass: boolean;

    constructor(public dialog: DialogRef<SlotConfirmationModalContext>) {
        this.context = dialog.context;
        this.wrongAnswer = true;
        dialog.setCloseGuard(this);
    }

    onKeyUp(value) {
        this.wrongAnswer = value != 5;
        this.dialog.close();
    }


    beforeDismiss(): boolean {
        return true;
    }

    beforeClose(): boolean {
        return this.wrongAnswer;
    }
}
