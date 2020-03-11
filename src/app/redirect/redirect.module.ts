import { NgModule } from '@angular/core';
import { RedirectComponent } from './redirect.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [BrowserModule, FormsModule, SharedModule],
  declarations: [RedirectComponent],
  exports: [RedirectComponent],
  entryComponents: [],
})
export class RedirectModule {}
