import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class NotificationService {
  constructor(private http: HttpClient) {}

  public sendDiscordNotification(discordUrl: string, content: string, username: string): Observable<any> {
    let headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http
      .post(discordUrl, { content: content, username: username }, { headers: headers })
      .pipe(catchError(this.handleErrorObservable));
  }

  public sendSlackNotification(
    webhookUrl: string,
    channel: string,
    text: string,
    username = 'Raffle Tool',
    icon = ':eggplant:',
  ): Observable<any> {
    return this.http
      .post(
        webhookUrl,
        { channel, username, icon_emoji: icon, text },
        { headers: { 'content-type': 'application/x-www-form-urlencoded' } },
      )
      .pipe(catchError(this.handleErrorObservable));
  }

  private handleErrorObservable(error: any) {
    console.error(error.message || error);
    return observableThrowError(error.message || error);
  }
}
