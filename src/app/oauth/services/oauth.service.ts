import {Injectable} from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';

@Injectable()
export class OauthService {
    public accessTokenObservable: Observable<any>;
    private accessTokenObserver: Observer<any>;

    private authUrl = 'https://www.reddit.com/api/v1/authorize';
    //PROD
    //private client_id = 'r6dZ3REoL89n2A';
    //private client_secret = 'fZ4l6sEAnJRPD4cLIjXkyniE_Qo';

    //TEST
    private client_id = '40BtLpGGLTlHow';
    private client_secret = 'C6O06ZscQt_qhyS26vi-DDLI5Nk';

    //LOCAL
    //private client_id = 'UWap4qOFI6uYgw';
    //private client_secret = 'PwroVMyw3nRPEHHjTVxxUPed_tw';

    //PROD
    //private redirectUri = 'https://edc-raffle-tool.firebaseapp.com/home';

    //TEST
    private redirectUri = 'https://test-edc-raffle-tool.firebaseapp.com/home';

    //local
    //private redirectUri = 'http://localhost:4200/home';

    private accessTokenUrl = 'https://www.reddit.com/api/v1/access_token';
    private state = 'XYZ';
    private accessToken = '';
    private refreshToken = '';
    private expireTime: number;

    constructor(private http: Http) {
        this.accessTokenObservable = new Observable(observer => this.accessTokenObserver = observer).share();
    }

    public requestAccessToken(authCode: string, state: string): Observable<any> {
        this.retrieveAccessToken(authCode, state).subscribe(
            response => {
                const currentDate = new Date();

                this.accessToken = response.access_token;
                this.refreshToken = response.refresh_token;
                this.expireTime = (Math.round(currentDate.getTime() / 1000)) + response.expires_in - 30;

                this.accessTokenObserver.next({success: true});
            },
            err => {
                console.error(err);
                this.accessTokenObserver.next({success: false, error: err});
            }
        );

        return this.accessTokenObservable;
    }

    public getAccessToken(): Observable<any> {
        const currentDate = new Date();
        if ((Math.round(currentDate.getTime() / 1000)) >= this.expireTime) {
            return this.refreshAccessToken();
        } else {
            return Observable.of({access_token: this.accessToken}).map(o => o);
        }
    }

    public requestPermission () {
        window.location.href = this.authUrl + '?client_id=' + this.client_id + '&response_type=code&' +
            'state=' + this.state + '&redirect_uri=' + this.redirectUri + '&duration=permanent&scope=identity,edit,submit';
    }

    private retrieveAccessToken(authCode: string, state: string): Observable<any> {
        if (this.state !== state) {
            console.error('States dont match!', this.state, state);
            return Observable.throw('States do not match!');
        }

        let form = new FormData();
        form.append('code', authCode);
        form.append('grant_type', 'authorization_code');
        form.append('redirect_uri', this.redirectUri );

        let headers = new Headers({ 'Authorization': 'Basic ' + btoa(this.client_id + ':' + this.client_secret) });
        headers.append('Accept', 'application/json');
        return this.http.post(this.accessTokenUrl, form, {headers: headers})
        .map(res =>  res.json())
        .catch(this.handleErrorObservable);
    }

    private handleErrorObservable (error: Response | any) {
        console.error(error.message || error);
        return Observable.throw(error.message || error);
    }

    private refreshAccessToken(): Observable<any> {
        let form = new FormData();
        form.append('grant_type', 'refresh_token');
        form.append('refresh_token', this.refreshToken );

        let headers = new Headers({ 'Authorization': 'Basic ' + btoa(this.client_id + ':' + this.client_secret) });
        headers.append('Accept', 'application/json');
        return this.http.post(this.accessTokenUrl, form, {headers: headers})
            .map(res =>  this.extractToken(res))
            .catch(this.handleErrorObservable);
    }

    private extractToken(response: Response) {
        const currentDate = new Date();
        let body = response.json();

        this.accessToken = body.access_token;
        this.expireTime = (Math.round(currentDate.getTime() / 1000)) + body.expires_in - 30;

        return body || {};
    }
}
