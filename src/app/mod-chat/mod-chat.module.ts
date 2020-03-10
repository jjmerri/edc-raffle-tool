import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabase } from 'angularfire2/database';
import { SharedModule } from 'app/shared/shared.module';
import { environment } from 'environments/environment';
import { TimeagoModule } from 'ngx-timeago';

@NgModule({
  imports: [CommonModule],
  declarations: [],
  exports: [TimeagoModule],
  entryComponents: [],
  providers: [AngularFireDatabase]
})
export class ModChatModule {}
