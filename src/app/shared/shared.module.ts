import { AsyncPipe, CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ModChatComponent } from '../mod-chat/mod-chat.component';
import { ModChatModule } from '../mod-chat/mod-chat.module';

@NgModule({
  imports: [ModChatModule, CommonModule, FormsModule],
  declarations: [ModChatComponent],
  exports: [ModChatComponent],
  entryComponents: [],
  providers: [],
})
export class SharedModule {}
