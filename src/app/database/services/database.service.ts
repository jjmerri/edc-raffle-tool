import {Injectable} from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {environment} from '../../../environments/environment';

@Injectable()
export class DatabaseService {
    private databaseUri = environment.databaseUri;

    private processedCommentsUrl = this.databaseUri + '/processed_comments';

    constructor(private http: Http) {
    }

    public storeProcessedComments(userId: string, submissionName: string, processedComments: string[]): Observable<any> {
        let fullUri = this.processedCommentsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new Headers({});
        headers.append('Accept', 'application/json');
        return this.http.put(fullUri, processedComments, {headers: headers})
            .map(res =>  res.json())
            .catch(this.handleErrorObservable);
    }

    public getProcessedComments(userId: string, submissionName: string): Observable<any> {
        let fullUri = this.processedCommentsUrl + '/' + userId + '/' + submissionName + '.json';
        let headers = new Headers({});
        headers.append('Accept', 'application/json');
        return this.http.get(fullUri, {headers: headers})
            .map(res =>  res.json())
            .catch(this.handleErrorObservable);
    }

    private handleErrorObservable (error: Response | any) {
        console.error(error.message || error);
        return Observable.throw(error.message || error);
    }
}
