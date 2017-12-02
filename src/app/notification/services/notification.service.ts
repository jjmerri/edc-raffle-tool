import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class NotificationService {
    //private edcRaffleDiscordUrl = 'https://discordapp.com/api/webhooks/378950331171602434/aiQqx3VkeC9Y10Px_e6oFlDc9Jj9ktO4UMjCeSNOBEuvBFUUJRJNhjIJ8ZIZo2fn7Tak';
    private edcRaffleDiscordUrl = 'https://discordapp.com/api/webhooks/384374555109752843/Bxoop5I7NSmomFb3_TaL64wkUAPo3KLXf0BTxPVAxPyqhmQj9PyWIzBDCIfe0Makkitv';

    constructor(private http: HttpClient) {
    }

    public sendEdcRaffleNotification(content: string, username: string): Observable<any> {
        let headers = new HttpHeaders({});
        headers.append('Accept', 'application/json');
        return this.http.post(this.edcRaffleDiscordUrl, {content: content, username: username}, {headers: headers})
            .catch(this.handleErrorObservable);
    }

    private handleErrorObservable (error: Response | any) {
        console.error(error.message || error);
        return Observable.throw(error.message || error);
    }
}
