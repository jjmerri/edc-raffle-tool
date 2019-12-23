import { Component, OnInit } from '@angular/core';
import { DialogRef, ModalComponent } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class ConfirmNewRaffleModalContext extends BSModalContext {
  public raffleForm: any;
}

@Component({
  selector: 'app-confirm-new-raffle',
  templateUrl: './confirm-new-raffle.modal.component.html'
})
export class ConfirmNewRaffleModalComponent
  implements OnInit, ModalComponent<ConfirmNewRaffleModalContext> {
  private context: ConfirmNewRaffleModalContext;
  private raffleTitle: string;
  private raffleBody: string;
  private subreddit: string;

  private raffleForm: any;

  constructor(public dialog: DialogRef<ConfirmNewRaffleModalContext>) {
    this.context = dialog.context;
    this.raffleForm = dialog.context.raffleForm;
  }

  ngOnInit() {
    const raffleType =
      this.raffleForm.raffleType !== 'Custom'
        ? this.raffleForm.raffleType
        : this.raffleForm.customType;

    this.raffleTitle = `[${raffleType}] ${this.raffleForm.itemName} - ${this.raffleForm.numSlots} spots at $${this.raffleForm.slotCost}/ea`;
    this.raffleBody = this.getRaffleBody(this.raffleForm);
    this.subreddit = this.raffleForm.subreddit;
  }
  private getRaffleBody(raffleForm: any): string {
    const approvalText = this.getOptionalText(
      '**Approval:**|',
      raffleForm.approvalLink
    );

    let priceJustificationText = this.getOptionalText(
      '**Price Justification:**|',
      raffleForm.priceJustification1
    );
    priceJustificationText += this.getOptionalText(
      '**Price Justification:**|',
      raffleForm.priceJustification2
    );
    priceJustificationText += this.getOptionalText(
      '**Price Justification:**|',
      raffleForm.priceJustification3
    );
    priceJustificationText += this.getOptionalText(
      '**Price Justification:**|',
      raffleForm.priceJustification4
    );

    let previousRaffleText = this.getOptionalText(
      '**Previous Raffle (If applicable)**|',
      raffleForm.previousRaffle
    );

    return (
      `**Item Name:**|${raffleForm.itemName}
--:|:--
**Price:**|$${raffleForm.numSlots * raffleForm.slotCost}
**# of Spots:**|${raffleForm.numSlots}` +
      approvalText +
      previousRaffleText +
      priceJustificationText +
      `
**Location/Country:**|${
        this.raffleForm.location !== 'Other'
          ? this.raffleForm.location
          : this.raffleForm.otherLocation
      }
**Will ship international?**|${raffleForm.shipping}
**Timestamp/pics:**|${raffleForm.images}
**Escrow:**|${raffleForm.escrow}
**Description:**|${raffleForm.description}
`
    );
  }

  private getOptionalText(text: string, value: string): string {
    return value ? `\n${text}${value}` : '';
  }

  private closeModal() {
    this.dialog.close();
  }

  private confirmSubmition() {
    this.dialog.close({
      raffleTitle: this.raffleTitle,
      raffleBody: this.raffleBody,
      ...this.raffleForm
    });
  }
}
