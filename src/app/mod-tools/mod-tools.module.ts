import { NgModule } from '@angular/core';
import { ModToolsComponent } from './mod-tools.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [BrowserModule, FormsModule, SharedModule],
  declarations: [ModToolsComponent],
  exports: [ModToolsComponent],
  entryComponents: [],
})
export class ModToolsModule {}
