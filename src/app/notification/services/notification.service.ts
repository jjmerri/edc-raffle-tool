import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class NotificationService {
    private edcRaffleDiscordUrl = 'https://discordapp.com/api/webhooks/452145996663619594/vEUEJbaNlkjmRchtUTDAwnXlKcUWj8vfbvlYVxup5xwifO19tuHajsRCRTIQfGbmFPsk';

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
