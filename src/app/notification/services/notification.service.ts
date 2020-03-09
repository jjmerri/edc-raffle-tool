
import {throwError as observableThrowError, Observable} from 'rxjs';

import {catchError} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Response} from '@angular/http';

@Injectable()
export class NotificationService {
    constructor(private http: HttpClient) {
    }

    public sendDiscordNotification(discordUrl: string, content: string, username: string): Observable<any> {
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.post(discordUrl, {content: content, username: username}, {headers: headers}).pipe(
            catchError(this.handleErrorObservable));
    }

    private handleErrorObservable (error: Response | any) {
        console.error(error.message || error);
        return observableThrowError(error.message || error);
    }
}
