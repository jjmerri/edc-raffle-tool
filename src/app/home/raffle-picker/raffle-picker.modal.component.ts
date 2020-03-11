import { Component, OnInit } from '@angular/core';
import { CloseGuard, DialogRef, ModalComponent } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class RafflePickerModalContext extends BSModalContext {
  public raffles: any;
}

@Component({
  selector: 'app-raffle-picker',
  templateUrl: './raffle-picker.modal.component.html',
})
export class RafflePickerModalComponent implements OnInit, ModalComponent<RafflePickerModalContext> {
  private context: RafflePickerModalContext;
  public raffles = [];

  constructor(public dialog: DialogRef<RafflePickerModalContext>) {
    this.context = dialog.context;
  }

  ngOnInit() {
    this.raffles = this.context.raffles;
  }
  private linkRaffle(index: number) {
    this.dialog.close(this.raffles[index]);
  }
}
