import { Component, OnInit } from '@angular/core';
import { CloseGuard, DialogRef, ModalComponent } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class SlotTextModalContext extends BSModalContext {
  public commentText: string;
  public copyText: (id: string) => {};
  public numSlots: number;
}

@Component({
  selector: 'app-slot-text',
  templateUrl: './slot-text.modal.component.html'
})
export class SlotTextModalComponent
  implements OnInit, ModalComponent<SlotTextModalContext> {
  private context: SlotTextModalContext;
  public commentText: string;
  public copyText: (id: string) => {};
  private numSlots: number;

  constructor(public dialog: DialogRef<SlotTextModalContext>) {
    this.context = dialog.context;
  }

  ngOnInit() {
    this.commentText = this.context.commentText;
    this.copyText = this.context.copyText;
    this.numSlots = this.context.numSlots;

    const commentControl: any = document.getElementById('commentText');
    commentControl.rows = this.numSlots * 2 + 1;
  }

  public closeModal() {
    this.dialog.close();
  }
}
