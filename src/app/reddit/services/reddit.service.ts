import {Injectable} from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {OauthService} from '../../oauth/services/oauth.service';

@Injectable()
export class RedditService {

    private publicRedditUrl = 'https://www.reddit.com';
    private secureRedditUrl = 'https://oauth.reddit.com';

    private userDetailsUrl = this.secureRedditUrl + '/api/v1/me';
    private userSubmissionsPlaceholder = this.publicRedditUrl + '/user/{userName}/submitted.json?sort=new';
    private editUrl = this.secureRedditUrl + '/api/editusertext';
    private composeUrl = this.secureRedditUrl + '/api/compose';
    private commentUrl = this.secureRedditUrl + '/api/comment';
    private inboxUrl = this.secureRedditUrl + '/message/inbox';
    private childrenUrl = this.secureRedditUrl + '/api/morechildren';

    private approvedSubs = ['edc_raffle', 'testingground4bots', 'KnifeRaffle'];

    constructor(private http: Http, private oauthService: OauthService) {
    }

    public getUserDetails(): Observable<any> {
        return Observable.create(observer => {
            this.oauthService.getAccessToken().subscribe(response => {
                    let headers = new Headers({ 'Authorization': 'Bearer ' + response.access_token});
                    headers.append('Accept', 'application/json');
                    this.http.get(this.userDetailsUrl, {headers: headers})
                        .map(res => res.json())
                        .subscribe(userDetailsResponse => {
                                observer.next(userDetailsResponse);
                                observer.complete();
                            },
                            err => {
                                console.error(err);
                                observer.error(err);
                                observer.complete();
                            }
                        );
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }

    public getUserSubmissions(userName: string): Observable<any> {
        const re = /{userName}/;
        const userSubmissionsUrl = this.userSubmissionsPlaceholder.replace(re, userName);

        return this.http.get(userSubmissionsUrl, {})
            .map(res => res.json())
            .catch(this.handleErrorObservable);
    }

    public getCurrentRaffleSubmission(userName: string) {
        return Observable.create(observer => {
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
                                if (submission.stickied) {
                                    continue;
                                } else {
                                    break;
                                }
                            } else if (this.approvedSubs.indexOf(submission.subreddit) !== -1 &&
                                submission.link_flair_text !== 'Complete' && submission.link_flair_text !== 'Canceled') {
                                currentRaffle = submission;
                                break;
                            }
                        }
                    }
                    observer.next(currentRaffle);
                    observer.complete();
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }

    public updatePostText(postText: string, thing_id: string): Observable<any> {
        if (!postText) {
            return Observable.throw({error: 'cannot update post to empty string'});
        }

        return Observable.create(observer => {
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
                                observer.next(editResponse);
                                observer.complete();
                            },
                            err => {
                                console.error(err);
                                observer.error(err);
                                observer.complete();
                            }
                        );
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }

    public getSubmission(submissionUrl: string): Observable<any> {
        return this.http.get(submissionUrl, {})
            .map(res => res.json())
            .catch(this.handleErrorObservable);
    }

    public sendPm(recipient: string, subject: string, messageText: string) {
            if (!messageText) {
                return Observable.throw({error: 'cannot send empty PM!'});
            }

        return Observable.create(observer => {
            this.oauthService.getAccessToken().subscribe(response => {
                    let form = new FormData();
                    form.append('api_type', 'json');
                    form.append('text', messageText);
                    form.append('subject', subject );
                    form.append('to', recipient );

                    let headers = new Headers({ 'Authorization': 'Bearer ' + response.access_token});
                    headers.append('Accept', 'application/json');
                    return this.http.post(this.composeUrl, form, {headers: headers})
                        .map(res => res.json())
                        .subscribe(composeResponse => {
                                observer.next(composeResponse);
                                observer.complete();
                            },
                            err => {
                                console.error(err);
                                observer.error(err);
                                observer.complete();
                            }
                        );
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }

    public postComment(commentText: string, thing_id: string): Observable<any> {
        if (!commentText) {
            return Observable.throw({error: 'cannot update post to empty string'});
        }

        return Observable.create(observer => {
            this.oauthService.getAccessToken().subscribe(response => {
                    let form = new FormData();
                    form.append('api_type', 'json');
                    form.append('text', commentText);
                    form.append('thing_id', thing_id);

                    let headers = new Headers({'Authorization': 'Bearer ' + response.access_token});
                    headers.append('Accept', 'application/json');
                    return this.http.post(this.commentUrl, form, {headers: headers})
                        .map(res => res.json())
                        .subscribe(composeResponse => {
                                observer.next(composeResponse);
                                observer.complete();
                            },
                            err => {
                                console.error(err);
                                observer.error(err);
                                observer.complete();
                            }
                        );
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }


    public getInbox(after: string, count: number): Observable<any> {
        return Observable.create(observer => {
            this.oauthService.getAccessToken().subscribe(response => {
                    let params = '?after=' + after + '&count=' + count + '&limit=100';

                    let headers = new Headers({'Authorization': 'Bearer ' + response.access_token});
                    headers.append('Accept', 'application/json');
                    return this.http.get(this.inboxUrl + params, {headers: headers})
                        .map(res => res.json())
                        .subscribe(pmResponse => {
                                observer.next(pmResponse);
                                observer.complete();
                            },
                            err => {
                                console.error(err);
                                observer.error(err);
                                observer.complete();
                            }
                        );
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }

    public getPostComments(permalink: string): Observable<any> {
        return Observable.create(observer => {
            this.oauthService.getAccessToken().subscribe(response => {
                    const params = '.json?sort=new';

                    let headers = new Headers({'Authorization': 'Bearer ' + response.access_token});
                    headers.append('Accept', 'application/json');
                    this.http.get(this.secureRedditUrl + permalink + params, {headers: headers})
                        .map(res => res.json())
                        .subscribe(commentsResponse => {
                                observer.next(commentsResponse[1].data.children);
                                observer.complete();
                            },
                            err => {
                                console.error(err);
                                observer.error(err);
                                observer.complete();
                            }
                        );
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }

    public getPmsAfter(createdAfter: number): Observable<any> {
        return Observable.create(observer => {
            let messages: any = [];
            let itemCount = 0;

            this.getInbox('', itemCount).expand((inboxItems) => {
                let listCount = 0;
                for (let message of inboxItems.data.children) {
                    listCount++;
                    itemCount++;
                    if (message.data.created_utc > createdAfter) {
                        if (message.kind === 't4') {
                            messages.push(message);
                        }
                        if (listCount === inboxItems.data.children.length) {
                            if (inboxItems.data.after) {
                                return this.getInbox(inboxItems.data.after, itemCount);
                            } else {
                                return Observable.empty();
                            }
                        }
                    } else {
                        observer.next(messages);
                        observer.complete();
                        return Observable.empty();
                    }
                }
            }).catch(error => observer.error(error)).subscribe((resp) => {
            });
        });
    }

    public getTopLevelComments(permalink: string, link_id: String): Observable<any> {
        return Observable.create(observer => {
            let topLevelComments = [];

            this.getComments(permalink, false, [], link_id, '').expand((comments) => {
                let child_ids = '';

                for (let z = 0; z < comments.length; z++) {
                    let comment = comments[z];
                    if (comment.kind === 't1' && comment.data.depth === 0) {
                        topLevelComments.push(comment);
                    }

                    if (z + 1 === comments.length) {
                        if (comment.kind === 'more') {
                            return this.getComments('', true, comment.data.children, link_id, comment.data.name);
                        } else {
                            observer.next(topLevelComments);
                            observer.complete();
                            return Observable.empty();
                        }
                    }
                }

                //no comments on post
                if (topLevelComments.length === 0 && comments.length === 0) {
                    observer.next(topLevelComments);
                    observer.complete();
                    return Observable.empty();
                }
            }).catch(error => observer.error(error)).subscribe((resp) => {
            });
        });
    }

    private getChildComments(child_ids: any, link_id: String, more_Id: String): Observable<any> {
        return Observable.create(observer => {
            this.oauthService.getAccessToken().subscribe(response => {
                    let form = new FormData();
                    form.append('api_type', 'json');
                    form.append('sort', 'new');
                    form.append('link_id', <any>link_id);
                    form.append('children', child_ids.join());
                    form.append('limit_children', <any>false);
                    form.append('depth', <any>0);
                    form.append('id', <any>more_Id);

                    let headers = new Headers({'Authorization': 'Bearer ' + response.access_token});
                    headers.append('Accept', 'application/json');
                    return this.http.post(this.childrenUrl, form, {headers: headers})
                    .map(res => res.json())
                    .subscribe(childrenResponse => {
                            observer.next(childrenResponse.json.data.things);
                            observer.complete();
                        },
                        err => {
                            console.error(err);
                            observer.error(err);
                            observer.complete();
                        }
                    );

                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
            );
        });
    }

    public getComments(permalink: string, getChildren: boolean, child_ids: any, link_id: String, more_Id: String): Observable<any> {
        return Observable.create(observer => {
            if (!getChildren) {
                this.getPostComments(permalink).subscribe(comments => {
                    observer.next(comments);
                    observer.complete();
                },
                err => {
                    console.error(err);
                    observer.error(err);
                    observer.complete();
                }
                );
            } else {
                this.getChildComments(child_ids, link_id, more_Id).subscribe(comments => {
                        observer.next(comments);
                        observer.complete();
                    },
                    err => {
                        console.error(err);
                        observer.error(err);
                        observer.complete();
                    }
                );
            }
        });
    }

    private handleErrorObservable (error: Response | any) {
        console.error(error.message || error);
        return Observable.throw(error.message || error);
    }
}
