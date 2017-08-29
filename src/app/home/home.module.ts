import { NgModule} from '@angular/core';
import {HomeComponent} from './home.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { PopoverModule } from 'ng2-pop-over';
import { SlotConfirmationModalComponent } from './slot-confirmation.modal.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        PopoverModule],
    declarations: [HomeComponent, SlotConfirmationModalComponent],
    exports: [HomeComponent],
    entryComponents: [SlotConfirmationModalComponent]
})
export class HomeModule { }
