import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {environment} from '../../../environments/environment';

@Injectable()
export class DatabaseService {
    private databaseUri = environment.databaseUri;

    private processedCommentsUrl = this.databaseUri + '/processed_comments';
    private paypalPmRecipientsUrl = this.databaseUri + '/paypal_pm_recipients';
    private modToolsUrl = this.databaseUri + '/mod_tools';
    private raffleParticipantsUrl = this.databaseUri + '/raffle_participants';

    constructor(private http: HttpClient) {
    }

    public storeProcessedComments(userId: string, submissionName: string, processedComments: string[]): Observable<any> {
        let fullUri = this.processedCommentsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.put(fullUri, processedComments, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    public getProcessedComments(userId: string, submissionName: string): Observable<any> {
        let fullUri = this.processedCommentsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.get(fullUri, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    public storePaypalPmRecipients(userId: string, submissionName: string, paypalPmRecipients: string[]): Observable<any> {
        let fullUri = this.paypalPmRecipientsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.put(fullUri, paypalPmRecipients, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    public getPaypalPmRecipients(userId: string, submissionName: string): Observable<any> {
        let fullUri = this.paypalPmRecipientsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.get(fullUri, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    public storeRaffleParticipants(userId: string, submissionName: string, raffleParticipants: string[]): Observable<any> {
        let fullUri = this.raffleParticipantsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.put(fullUri, raffleParticipants, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    public getRaffleParticipants(userId: string, submissionName: string): Observable<any> {
        let fullUri = this.raffleParticipantsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.get(fullUri, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    public getModTools(modToolsId: string): Observable<any> {
        let fullUri = this.modToolsUrl + '/' + modToolsId + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.get(fullUri, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    public createModTools(modToolsId: string): Observable<any> {
        let fullUri = this.modToolsUrl + '/' + modToolsId + '.json';
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.put(fullUri, {created: true}, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    private handleErrorObservable (error: Response | any) {
        console.error(error.message || error);
        return Observable.throw(error.message || error);
    }
}
