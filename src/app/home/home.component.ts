import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';
import {HostListener} from '@angular/core';

import { OauthService } from '../oauth/services/oauth.service';
import { RedditService} from '../reddit/services/reddit.service';
import {isNullOrUndefined} from "util";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    private raffleParticipants = [];
    private numSlots = 20;
    private randomSlot: number;
    private commentText: string;
    private unpaidUsers: string;
    private userName: string;
    private currentRaffle;
    private raffleImported = false;
    private calledSpotMessageShown = false;

    constructor(private activatedRoute: ActivatedRoute, private http: Http, private oauthSerice: OauthService,
                private redditService: RedditService) {
    }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            if (params['code']) {
                this.oauthSerice.requestAccessToken(params['code'], params['state']).subscribe(res => {
                    if (res.success === true) {
                        this.redditService.getUserDetails().subscribe(userDetailsResponse => {
                                if (userDetailsResponse.name) {
                                    this.userName = userDetailsResponse.name;

                                    this.redditService.getCurrentRaffleSubmission(userDetailsResponse.name)
                                        .subscribe(submissionResponse => {
                                          if(Object.keys(submissionResponse).length !== 0 && submissionResponse.constructor === Object) {
                                              this.currentRaffle = submissionResponse;
                                              this.importRaffleSlots(submissionResponse);
                                          }
                                        },
                                        err => {
                                            console.error(err);
                                        }
                                    );
                                }
                            },
                            err => {
                                console.error(err);
                            }
                        );
                    } else {
                        console.error('error retrieving access token', res);
                    }

                });
            }
        });
        this.updateRaffleSpots(this.numSlots);
    }

    public updateRaffleSpots(updatedNumSplots: number) {
        const prevSpots = this.raffleParticipants.length;
        if (updatedNumSplots > prevSpots) {
            for ( let x = prevSpots; x < updatedNumSplots; x++) {
                this.raffleParticipants[x] = {};
            }
        } else if (updatedNumSplots < prevSpots) {
            this.raffleParticipants.splice(updatedNumSplots, prevSpots - updatedNumSplots);
        }

        let commentControl: any = document.getElementById('commentText');
        commentControl.rows = this.numSlots * 2 + 1;

        this.updateCommentText();
    }

    public generateRandom() {
        let openRaffleSpots = [];
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            if (!this.raffleParticipants[x].name) {
                openRaffleSpots.push(x + 1);
            }
        }
        let min = 0;
        let max = openRaffleSpots.length - 1;
        let randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        this.randomSlot = openRaffleSpots[randomNum];

        document.getElementById('raffleParticipant' + (this.randomSlot - 1)).focus();
    }

    public updateCommentText() {
        this.commentText = '';
        this.unpaidUsers = '';

        for (let x = 0; x < this.raffleParticipants.length; x++) {
            let raffler = this.raffleParticipants[x];
            if (raffler.name) {
                raffler.name = raffler.name.replace(new RegExp(' ', 'g'), '');
                raffler.name = raffler.name.replace(new RegExp('/[uU]/', 'g'), '');
            }
            this.commentText += ( x + 1) + ' ' + (raffler.name ? '/u/' + raffler.name + ' ' : '') + (raffler.paid ? '**PAID**' : '') + '\n\n';
            this.unpaidUsers += !raffler.paid && raffler.name && this.unpaidUsers.indexOf('/u/' + raffler.name + ' ' ) === -1 ? '/u/' + raffler.name + ' ' : '';
        }


        if (this.currentRaffle) {
          this.redditService.getSubmission(this.currentRaffle.url + '.json').subscribe(getSubmissionResponse => {
                this.currentRaffle = getSubmissionResponse[0].data.children[0].data;
                const re = /<raffle-tool>[\s\S]*<\/raffle-tool>/;


                let txt: any;
                txt = document.createElement("textareatmp");
                txt.innerHTML = this.currentRaffle.selftext;
                let postText = txt.innerText;

                let slotText = '<raffle-tool>\n\nThis slot list is created and updated by ' +
                    '[The EDC Raffle Tool.](https://edc-raffle-tool.firebaseapp.com)\n\n' + this.commentText + '\n\n</raffle-tool>';

                if (postText.indexOf('<raffle-tool>') !== -1 && postText.indexOf('</raffle-tool>') !== -1) {
                    postText = postText.replace(re, slotText);
                } else {
                    postText += '\n\n' + slotText + '\n\n';
                }
                this.redditService.updatePostText(postText, this.currentRaffle.name)
                    .subscribe(postResponse => {
                            console.log(postResponse);
                        },
                        err => {
                            console.error(err);
                        }
                    );
              },
              err => {
                  console.error(err);
              }
          );
        }

    }

    public copyText(elementId: string) {
        let commentControl: any = document.getElementById(elementId);
        commentControl.select();
        document.execCommand('copy');
    }

    public linkWithReddit() {
        this.oauthSerice.requestPermission();
    }

    public importRaffleSlots(raffle: any) {
        const re = /<raffle-tool>[\s\S]*<\/raffle-tool>/;
        let txt: any;
        txt = document.createElement("textareatmp");
        txt.innerHTML = raffle.selftext;
        const postText = txt.innerText;

        const matches = postText.match(re);

        if (matches) {
            this.raffleParticipants = [];
            const slotList = matches[0];
            const slots = slotList.split('\n');
            let numSlots = 0;
            for (let i = 0; i < slots.length; i++) {
                if (slots[i].match(/^[\d]+ /)) {
                    numSlots++;
                    const slotParts = slots[i].split(' ');

                    if (slotParts[1]) {
                       this.raffleParticipants.push({name: slotParts[1].substr(3), paid: slotParts[2] === '**PAID**'});
                    } else {
                        this.raffleParticipants.push({});
                    }
                }
            }
            this.numSlots = numSlots;
            this.updateRaffleSpots(numSlots);
            this.raffleImported = true;
        }


    }

    private checkCalledSpot(event: any) {
        if (!this.calledSpotMessageShown &&
            (!this.randomSlot ||
                ((event.target.id !== 'raffleParticipant' + (this.randomSlot - 1)) && event.target.value === ''))) {
            alert('It looks like you are trying to fill a slot that isnt random. ' +
                'Please double check that your raffle allows called slots. You wont get this message again.');

            this.calledSpotMessageShown = true;
        }
    }

}
