import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { RaffleProperties } from '../../home/RaffleProperties';

@Injectable()
export class DatabaseService {
  private databaseUri = environment.databaseUri;

  private processedCommentsUrl = this.databaseUri + '/processed_comments';
  private rafflePropertiesUrl = this.databaseUri + '/raffle_properties';
  private paypalPmRecipientsUrl = this.databaseUri + '/paypal_pm_recipients';
  private modToolsUrl = this.databaseUri + '/mod_tools';
  private raffleParticipantsUrl = this.databaseUri + '/raffle_participants';
  private subredditSettingsUrl = this.databaseUri + '/subreddit_settings';

  constructor(private http: HttpClient) {}

  public storeProcessedComments(userId: string, submissionName: string, processedComments: string[]): Observable<any> {
    const fullUri = this.processedCommentsUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.put(fullUri, processedComments, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  public getProcessedComments(userId: string, submissionName: string): Observable<any> {
    const fullUri = this.processedCommentsUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.get(fullUri, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  public storePaypalPmRecipients(
    userId: string,
    submissionName: string,
    paypalPmRecipients: string[],
  ): Observable<any> {
    const fullUri = this.paypalPmRecipientsUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http
      .put(fullUri, paypalPmRecipients, { headers: headers })
      .pipe(catchError(this.handleErrorObservable));
  }

  public getPaypalPmRecipients(userId: string, submissionName: string): Observable<any> {
    const fullUri = this.paypalPmRecipientsUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.get(fullUri, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }
  public getRaffleProperties(userId: string, submissionName: string): Observable<any> {
    const fullUri = this.rafflePropertiesUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.get(fullUri, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  public storeRaffleProperties(
    userId: string,
    submissionName: string,
    raffleProperties: RaffleProperties,
  ): Observable<any> {
    const fullUri = this.rafflePropertiesUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.put(fullUri, raffleProperties, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  public storeRaffleParticipants(userId: string, submissionName: string, raffleParticipants: any[]): Observable<any> {
    const fullUri = this.raffleParticipantsUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http
      .put(fullUri, raffleParticipants, { headers: headers })
      .pipe(catchError(this.handleErrorObservable));
  }

  public getRaffleParticipants(userId: string, submissionName: string): Observable<any> {
    const fullUri = this.raffleParticipantsUrl + '/' + userId + '/' + submissionName + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.get(fullUri, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  public getModTools(modToolsId: string): Observable<any> {
    const fullUri = this.modToolsUrl + '/' + modToolsId + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.get(fullUri, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  public getSubredditSettings(subreddit: string): Observable<any> {
    const fullUri = this.subredditSettingsUrl + '/' + subreddit + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.get(fullUri, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  public createModTools(modToolsId: string): Observable<any> {
    const fullUri = this.modToolsUrl + '/' + modToolsId + '.json';
    const headers = new HttpHeaders({});
    headers.append('Accept', 'application/json');
    return this.http.put(fullUri, { created: true }, { headers: headers }).pipe(catchError(this.handleErrorObservable));
  }

  private handleErrorObservable(error: HttpResponse<any> | any) {
    console.error(error.message || error);
    return observableThrowError(error.message || error);
  }
}
