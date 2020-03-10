import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from 'angularfire2';
import { PopoverModule } from 'ng2-pop-over';
import { LogglyService } from 'ngx-loggly-logger';
import { ModalModule } from 'ngx-modialog';
import { BootstrapModalModule } from 'ngx-modialog/plugins/bootstrap';
import { TimeagoModule } from 'ngx-timeago';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { DatabaseService } from './database/services/database.service';
import { HomeModule } from './home/home.module';
import { LoggingService } from './logging-service/services/logging.service';
import { ModToolsModule } from './mod-tools/mod-tools.module';
import { NotificationService } from './notification/services/notification.service';
import { OauthService } from './oauth/services/oauth.service';
import { RedditService } from './reddit/services/reddit.service';
import { RedirectModule } from './redirect/redirect.module';

export const firebaseConfig = {
  apiKey: environment.firebaseApiKey,
  authDomain: environment.firebaseAuthDomain,
  databaseURL: environment.firebaseDatabaseUrl,
  storageBucket: environment.firebaseStorageBucket,
  messagingSenderId: environment.firebaseSenderId
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireStorageModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    routing,
    HomeModule,
    ModToolsModule,
    RedirectModule,
    PopoverModule,
    ModalModule.forRoot(),
    BootstrapModalModule,
    TimeagoModule.forRoot()
  ],
  providers: [
    OauthService,
    RedditService,
    DatabaseService,
    LogglyService,
    LoggingService,
    NotificationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
