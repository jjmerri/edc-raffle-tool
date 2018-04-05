import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PopoverModule } from 'ng2-pop-over';
import { ModalModule } from 'ngx-modialog';
import { BootstrapModalModule } from 'ngx-modialog/plugins/bootstrap';

import {RedditService} from './reddit/services/reddit.service';
import { OauthService} from './oauth/services/oauth.service';
import {DatabaseService} from './database/services/database.service';



import {routing} from './app.routes';

import {HomeModule} from './home/home.module';
import {ModToolsModule} from './mod-tools/mod-tools.module';

import { AppComponent } from './app.component';
import {LogglyService} from 'ngx-loggly-logger';
import {NotificationService} from './notification/services/notification.service';
import {RedirectModule} from "./redirect/redirect.module";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
      HttpClientModule,
    routing,
    HomeModule,
      ModToolsModule,
      RedirectModule,
      PopoverModule,
      ModalModule.forRoot(),
      BootstrapModalModule
  ],
  providers: [OauthService, RedditService, DatabaseService, LogglyService, NotificationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
