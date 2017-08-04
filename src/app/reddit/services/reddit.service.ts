import {Injectable} from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {OauthService} from '../../oauth/services/oauth.service';

@Injectable()
export class RedditService {
    private userDetailsObservable: Observable<any>;
    private userDetailsObserver: Observer<any>;

    private currentRaffleObservable: Observable<any>;
    private currentRaffleObserver: Observer<any>;

    private updatePostObservable: Observable<any>;
    private updatePostObserver: Observer<any>;

    private userDetailsUrl = 'https://oauth.reddit.com/api/v1/me';
    private userSubmissionsPlaceholder = 'https://www.reddit.com/user/{userName}/submitted.json?sort=new';
    private editUrl = 'https://oauth.reddit.com/api/editusertext';

    private approvedSubs = ['edc_raffle', 'testingground4bots'];

    constructor(private http: Http, private oauthService: OauthService) {
        this.userDetailsObservable = new Observable(observer => this.userDetailsObserver = observer).share();
        this.currentRaffleObservable = new Observable(observer => this.currentRaffleObserver = observer).share();
        this.updatePostObservable = new Observable(observer => this.updatePostObserver = observer).share();
    }

    public getUserDetails(): Observable<any> {
        this.oauthService.getAccessToken().subscribe(response => {
                let headers = new Headers({ 'Authorization': 'Bearer ' + response.access_token});
                headers.append('Accept', 'application/json');
                this.http.get(this.userDetailsUrl, {headers: headers})
                    .map(res => res.json())
                    .subscribe(userDetailsResponse => {
                        this.userDetailsObserver.next(userDetailsResponse);
                    },
                    err => {
                        console.error(err);
                        this.userDetailsObserver.next(err);
                    }
                );
            },
            err => {
                console.error(err);
            }
        );

        return this.userDetailsObservable;
    }

    public getUserSubmissions(userName: string): Observable<any> {
        const re = /{userName}/;
        const userSubmissionsUrl = this.userSubmissionsPlaceholder.replace(re, userName);

        return this.http.get(userSubmissionsUrl, {})
            .map(res => res.json())
            .catch(this.handleErrorObservable);
    }

    public getCurrentRaffleSubmission(userName: string) {
        this.getUserSubmissions(userName).subscribe(userSubmissionsResponse => {
                let currentRaffle: any;
                currentRaffle = {};
                if (userSubmissionsResponse && userSubmissionsResponse.data && userSubmissionsResponse.data.children) {
                    for (let i = 0; i < userSubmissionsResponse.data.children.length; i++) {
                        const submission = userSubmissionsResponse.data.children[i].data;

                        const currentDate = new Date();
                        const currentDateSeconds = currentDate.getTime() / 1000;
                        const submissionAge = currentDateSeconds - submission.created_utc;

                        // submissions are ordered by age
                        // if submissionAge > 48 hours nothing beyond this will be current
                        if (submissionAge > (48 * 60 * 60)) {
                            break;
                        } else if (this.approvedSubs.indexOf(submission.subreddit) !== -1 &&
                                   submission.link_flair_text !== 'Complete' && submission.link_flair_text !== 'Canceled') {
                            currentRaffle = submission;
                            break;
                        }
                    }
                }
                this.currentRaffleObserver.next(currentRaffle);
            },
            err => {
                console.error(err);
                this.currentRaffleObserver.next(err);
            }
        );

        return this.currentRaffleObservable;
    }

    public updatePostText(postText: string, thing_id: string): Observable<any> {
        if (!postText) {
            return Observable.throw({error: 'cannot update post to empty string'});
        }

        this.oauthService.getAccessToken().subscribe(response => {
                let form = new FormData();
                form.append('api_type', 'json');
                form.append('text', postText);
                form.append('thing_id', thing_id );

                let headers = new Headers({ 'Authorization': 'Bearer ' + response.access_token});
                headers.append('Accept', 'application/json');
                return this.http.post(this.editUrl, form, {headers: headers})
                    .map(res => res.json())
                    .subscribe(editResponse => {
                            this.updatePostObserver.next(editResponse);
                        },
                        err => {
                            console.error(err);
                            this.updatePostObserver.next(err);
                        }
                    );
            },
            err => {
                console.error(err);
                this.updatePostObserver.next(err);
            }
        );

        return this.updatePostObservable;
    }

    public getSubmission(submissionUrl: string): Observable<any> {
        return this.http.get(submissionUrl, {})
            .map(res => res.json())
            .catch(this.handleErrorObservable);
    }

    private handleErrorObservable (error: Response | any) {
        console.error(error.message || error);
        return Observable.throw(error.message || error);
    }
}
