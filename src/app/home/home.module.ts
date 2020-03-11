import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { PopoverModule } from 'ng2-pop-over';

import { SharedModule } from '../shared/shared.module';
import { FinishRaffleModalComponent } from './finish-raffle/finish-raffle.modal.component';
import { HomeComponent } from './home.component';
import { ConfirmNewRaffleModalComponent } from './new-raffle/confirm-new-raffle.modal.component';
import { NewRaffleModalComponent } from './new-raffle/new-raffle.modal.component';
import { RafflePickerModalComponent } from './raffle-picker/raffle-picker.modal.component';
import { SlotConfirmationModalComponent } from './slot-confirmation/slot-confirmation.modal.component';
import { SlotTextModalComponent } from './slot-text/slot-text.modal.component';
import { TermsOfServiceModalComponent } from './terms-of-service/terms-of-service.modal.component';

@NgModule({
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, PopoverModule, SharedModule],
  declarations: [
    HomeComponent,
    SlotConfirmationModalComponent,
    RafflePickerModalComponent,
    TermsOfServiceModalComponent,
    FinishRaffleModalComponent,
    SlotTextModalComponent,
    NewRaffleModalComponent,
    ConfirmNewRaffleModalComponent,
  ],
  exports: [HomeComponent],
  entryComponents: [
    SlotConfirmationModalComponent,
    RafflePickerModalComponent,
    TermsOfServiceModalComponent,
    FinishRaffleModalComponent,
    SlotTextModalComponent,
    NewRaffleModalComponent,
    ConfirmNewRaffleModalComponent,
  ],
  providers: [],
})
export class HomeModule {}
