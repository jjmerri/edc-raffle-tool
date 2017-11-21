import { NgModule} from '@angular/core';
import {HomeComponent} from './home.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { PopoverModule } from 'ng2-pop-over';
import { SlotConfirmationModalComponent } from './slot-confirmation.modal.component';
import { RafflePickerModalComponent } from './raffle-picker.modal.component';
import { TermsOfServiceModalComponent } from './terms-of-service.modal.component';
import {SharedModule} from '../shared/shared.module';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        PopoverModule,
    SharedModule],
    declarations: [HomeComponent, SlotConfirmationModalComponent, RafflePickerModalComponent, TermsOfServiceModalComponent],
    exports: [HomeComponent],
    entryComponents: [SlotConfirmationModalComponent, RafflePickerModalComponent, TermsOfServiceModalComponent],
    providers: []
})
export class HomeModule { }
