import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { OauthService} from './oauth/services/oauth.service';

import {routing} from './app.routes';

import {HomeModule} from './home/home.module';

import { AppComponent } from './app.component';
import {RedditService} from './reddit/services/reddit.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing,
    HomeModule
  ],
  providers: [OauthService, RedditService],
  bootstrap: [AppComponent]
})
export class AppModule { }
