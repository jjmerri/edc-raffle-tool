import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import { Modal, BSModalContext} from 'ngx-modialog/plugins/bootstrap';
import { overlayConfigFactory } from 'ngx-modialog';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {environment} from '../../environments/environment';

import 'rxjs/Rx';
import swal from 'sweetalert2';

import { OauthService } from '../oauth/services/oauth.service';
import { RedditService} from '../reddit/services/reddit.service';
import {SlotConfirmationModalComponent} from './slot-confirmation.modal.component';
import { RafflePickerModalComponent } from './raffle-picker.modal.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    private raffleParticipants = [];
    private numSlots = 1;
    private randomSlot: number;
    private commentText: string;
    private unpaidUsers: string;
    private userName: string;
    private currentRaffle;
    private raffleImported = false;
    private calledSpotMessageShown = false;
    private payPalMessageShown = false;
    private paidPopoverProperties = {};
    private closePopOver = false;
    private numOpenSlots = this.numSlots;
    private payPalInfo: string;
    private payPalPmMessage = 'Thank you for participating in the raffle. Please find my PayPal info below.\n\n' +
        '**Please reply to this message with the name on your paypal account and the number of slots you received.**\n\n';
    private popUpTimer: any;
    private skippedPms = [];
    private confirmedComments = [];
    private shownNewFeatureMessageSlotAssignmentHelper = false;
    private isModtober = false;
    private raffleToolUri = environment.redirectUri;

    private mods = {  edc_raffle: ['EDCRaffleAdmin', 'EDCRaffleMod', 'EDCRaffleMod1', 'EDCRaffleMod2', 'EDCRaffleMod3', 'EDCRaffleMod4', 'EDCRaffleMod5', 'EDCRaffleDiscordMod'],
                            testingground4bots: ['raffleTestMod1', 'raffleTestMod2', 'raffleTestMod3', 'raffleTestMod4'],
                            KnifeRaffle: ['Plazzed', 'accidentlyporn', 'twolfcale', 'theoddjosh', 'Fbolanos', 'cda555', 'Gimli_The_Drunk'],
                            raffleTest: ['BoyAndHisBlob']
                    };

    constructor(private activatedRoute: ActivatedRoute, private oauthSerice: OauthService,
                private redditService: RedditService, private modal: Modal) {
    }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            if (params['code']) {
                this.oauthSerice.requestAccessToken(params['code'], params['state']).subscribe(res => {
                    if (res.success === true) {
                        this.loadRaffle();
                    } else {
                        console.error('error retrieving access token', res);
                    }

                });
            }

            if (params['modtober_subreddit']) {
                this.showModtoberModMessage(params['modtober_subreddit']);
            }
        });
        this.updateRaffleSlots(this.numSlots);
    }

    private updateRaffleSlots(updatedNumSlots: number) {
        const prevSpots = this.raffleParticipants.length;
        if (updatedNumSlots > prevSpots) {
            for ( let x = prevSpots; x < updatedNumSlots; x++) {
                this.raffleParticipants[x] = {};
            }
        } else if (updatedNumSlots < prevSpots) {
            this.raffleParticipants.splice(updatedNumSlots, prevSpots - updatedNumSlots);
        }

        let commentControl: any = document.getElementById('commentText');
        commentControl.rows = this.numSlots * 2 + 1;

        this.updateCommentText();
    }

    private generateRandom() {
        this.getRandomUnclaimedSlotNumber().subscribe(randomSlot => {
            if (randomSlot) {
                this.randomSlot = randomSlot;
                document.getElementById('raffleParticipant' + (randomSlot - 1)).focus();
            }
        });
    }

    private getRandomUnclaimedSlotNumber(): Observable<any> {
        return Observable.create(observer => {
            let openRaffleSlots = [];
            for (let x = 0; x < this.raffleParticipants.length; x++) {
                if (!this.raffleParticipants[x].name) {
                    openRaffleSlots.push(x + 1);
                }
            }
            if (openRaffleSlots.length > 0) {
                const min = 0;
                const max = openRaffleSlots.length - 1;
                const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
                observer.next(openRaffleSlots[randomNum]);
                observer.complete();
            } else {
                observer.next(0);
                observer.complete();
            }
        });
    }

    public updateCommentText() {
        let numSlotsTaken = 0;
        this.commentText = '';
        this.unpaidUsers = '';

        for (let x = 0; x < this.raffleParticipants.length; x++) {
            let raffler = this.raffleParticipants[x];
            if (raffler.name) {
                raffler.name = raffler.name.replace(new RegExp(' ', 'g'), '');
                raffler.name = raffler.name.replace(new RegExp('/[uU]/', 'g'), '');

                numSlotsTaken++;
            }
            this.commentText += ( x + 1) + ' ' + (raffler.name ? '/u/' + raffler.name + ' ' : '') + (raffler.paid ? '**PAID**' : '') + '\n\n';
            this.unpaidUsers += !raffler.paid && raffler.name && this.unpaidUsers.indexOf('/u/' + raffler.name + ' ' ) === -1 ? '/u/' + raffler.name + ' ' : '';
        }

        this.numOpenSlots = this.numSlots - numSlotsTaken;


        if (this.currentRaffle) {
          this.redditService.getSubmission(this.currentRaffle.permalink + '.json').subscribe(getSubmissionResponse => {
                this.currentRaffle = getSubmissionResponse[0].data.children[0].data;
                const re = /<raffle-tool>[\s\S]*<\/raffle-tool>/;


                let txt: any;
                txt = document.createElement("textareatmp");
                txt.innerHTML = this.currentRaffle.selftext;
                let postText = txt.innerText;

                let slotText = '<raffle-tool>\n\nThis slot list is created and updated by ' +
                    '[The EDC Raffle Tool](https://edc-raffle-tool.firebaseapp.com) by BoyAndHisBlob.\n\n' +
                    this.commentText + '\n\n</raffle-tool>';

                if (postText.indexOf('<raffle-tool>') !== -1 && postText.indexOf('</raffle-tool>') !== -1) {
                    postText = postText.replace(re, slotText);
                } else {
                    postText += '\n\n' + slotText + '\n\n';
                }
                this.redditService.updatePostText(postText, this.currentRaffle.name)
                    .subscribe(postResponse => {
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
        const commentControl: any = document.getElementById(elementId);
        commentControl.select();
        document.execCommand('copy');
    }

    public linkWithReddit() {
        this.oauthSerice.requestPermission();
    }

    public importRaffleSlots(raffle: any) {
        const re = /<raffle-tool>[\s\S]*<\/raffle-tool>/;
        let txt: any;
        txt = document.createElement('textareatmp');
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
            this.updateRaffleSlots(numSlots);
            this.raffleImported = true;
        }


    }

    private checkCalledSpot(event: any) {
        if (!this.calledSpotMessageShown &&
            event.target.value === '' && (!this.randomSlot ||
                (event.target.id !== 'raffleParticipant' + (this.randomSlot - 1)))) {

            swal('Are Called Slots Allowed?',
                'It looks like you are trying to fill a slot that isnt random. ' +
                'Please double check that your raffle allows called slots. You wont get this message again.',
                'question'
            ).then(() => {
            }, (dismiss) => {
            });

            this.calledSpotMessageShown = true;
        }
    }

    private updateAffectedSlots(name: string, event: any) {
        let numAffected = 1;

        this.closePopOver = false;

        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && (raffler.name.toUpperCase() === name.toUpperCase())) {
                if (raffler.paid !== event.target.checked) {
                    raffler.paid = event.target.checked;
                    numAffected++;
                }
            }
        }

        this.paidPopoverProperties = {numAffected: numAffected, paid: event.target.checked};

        this.updateCommentText();

        // close popOver after 3 seconds
        clearInterval(this.popUpTimer);
        this.popUpTimer = setInterval(() => {
            this.closePopOver = true;
            clearInterval(this.popUpTimer);
        }, 3000);

    }

    private showPayPalWarning(event: any) {
        if (!this.payPalMessageShown) {
            swal('',
                'Entering your PayPal info will cause <strong>PMs to be sent</strong> to participants as you add them to the slot list. ' +
                'Only newly added participants will be PM\'d. You won\'t get this message again.</br></br>' +
                '<strong>Example PM:</strong></br>' + this.payPalPmMessage + '</br>https://www.paypal.me/yourname',
                'info'
            ).then(() => {
            }, (dismiss) => {
            });
            this.payPalMessageShown = true;
        }
    }

    private sendPayPalPm(recipient: string) {
        let recipientNumSlots = 0
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && (raffler.name.toUpperCase() === recipient.toUpperCase())) {
                recipientNumSlots++;
            }
        }

        if (recipient && recipientNumSlots === 1 && this.payPalInfo) {
            const subject = 'PayPal Info For: ' + this.currentRaffle.title;
            this.redditService.sendPm(recipient, subject.substr(0, 100),
                this.payPalPmMessage + this.payPalInfo +
                '\n\n^^^.\n\n^(Message auto sent from The EDC Raffle Tool by BoyAndHisBlob.)\n\n').subscribe();
        }
    }

    private donateSlot() {
        const commentText = 'I am donating a random slot to /u/BoyAndHisBlob as a thank you for creating and maintaining the Raffle Tool.' +
            '\n\nThis slot request will be processed in the order it was received in the queue.';

        if (this.currentRaffle) {
            swal({
                title: 'Donate Slot?',
                html: 'This will post the below comment to your raffle. Thank you for donating!<br /><br />' + '<i>' + commentText + '</i>',
                type: 'info',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Donate Slot'
            }).then( () => {
                this.redditService.postComment(commentText, this.currentRaffle.name).subscribe();

                swal(
                    'Donation Comment Posted!',
                    'Please process the slot request in the order it was recieved in the queue and thank you again for your generosity!',
                    'success'
                ).then(() => {
                }, (dismiss) => {
                });
            }, (dismiss) => {
            });
        }
    }

    private runPaymentConfirmer() {
        this.redditService.getPmsAfter(this.currentRaffle.created_utc).subscribe(messages => {
            if (messages && messages.length) {
                this.showPm(messages, messages.length -1);
            } else {
                this.showNoUnpaidPms();
            }
        });
    }

    private showPm(messages: any, messageIndex: number) {
        if (messageIndex < 0) {
            return;
        }

        const message = messages[messageIndex];
        const authorSlotCount = this.getNumberSlots(message.data.author);
        const authorPaid = this.isUserPaid(message.data.author);

        let txt: any;
        txt = document.createElement('temptxt');
        txt.innerHTML = decodeURI(message.data.body_html);

        if (authorSlotCount && !authorPaid && this.skippedPms.indexOf(message.data.name) === -1) {
            swal({
                title: 'Unpaid Raffle Participant PMs',
                html: '<h3 class="text-left"><b>From: ' + message.data.author + ' (' + authorSlotCount + ' total slots)' +
                '<br />Subject: ' + message.data.subject + ' </b>' +
                '</h3> <div class="well text-left">' + txt.innerText + '</div>',
                showCloseButton: true,
                showCancelButton: true,
                cancelButtonText: 'No PayPal Info in PM',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Mark User As Paid'
            }).then(() => {
                this.markAsPaid(message.data.author);
                if (messageIndex !== 0) {
                    this.showPm(messages, messageIndex - 1);
                } else {
                    this.showNoUnpaidPms();
                }
            }, (dismiss) => {
                if (dismiss === 'cancel') {
                    this.skippedPms.push(message.data.name);
                    localStorage.setItem(this.currentRaffle.name + '_skippedPms', JSON.stringify(this.skippedPms));
                    if (messageIndex !== 0) {
                        this.showPm(messages, messageIndex - 1);
                    } else {
                        this.showNoUnpaidPms();
                    }
                }
            });
        } else if (messageIndex !== 0) {
            this.showPm(messages, messageIndex - 1);
        } else {
            this.showNoUnpaidPms();
        }

    }

    private getNumberSlots(userName: string): number {
        let numUserSlots = 0;
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && (raffler.name.toUpperCase() === userName.toUpperCase())) {
                numUserSlots++;
            }

            if (x + 1 === this.raffleParticipants.length) {
                return numUserSlots;
            }
        }
    }

    private isUserPaid(userName: string): boolean {
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && !raffler.paid && (raffler.name.toUpperCase() === userName.toUpperCase())) {
                return false;
            }

            if (x + 1 === this.raffleParticipants.length) {
                return true;
            }
        }
    }

    private showNoUnpaidPms() {
        const allPaid = this.isAllPaid();

        if (allPaid) {
            swal('All slots are marked paid, congrats on a successful raffle!',
                '',
                'info'
            ).then(() => {
            }, (dismiss) => {
            });
        } else {
            swal('No more PMs from unpaid raffle participants.',
                '',
                'info'
            ).then(() => {
            }, (dismiss) => {
            });
        }
    }

    private markAsPaid(userName: string) {
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && (raffler.name.toUpperCase() === userName.toUpperCase())) {
                raffler.paid = true;
            }

            if (x + 1 === this.raffleParticipants.length) {
                this.updateCommentText();
            }
        }
    }

    private isAllPaid(): boolean {
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (!raffler.paid) {
                return false;
            }

            if (x + 1 === this.raffleParticipants.length) {
                return true;
            }
        }
    }

    private slotAssignmentWizard() {
        this.redditService.getTopLevelComments(this.currentRaffle.permalink, this.currentRaffle.name).subscribe(comments => {
            for (let x = 0; x < comments.length; x++) {
                if (comments[x].data.author === 'AutoModerator') {
                    comments.splice(x, 1);
                }
            }

            let nextCommentIndex = -1;
            for (let x = 0; x < comments.length; x++) {
                if (this.confirmedComments.indexOf(comments[x].data.name) === -1) {
                    nextCommentIndex = x;
                    break;
                }
            }
            if (nextCommentIndex >= 0) {
                this.showSlotAssignmentModal(comments, nextCommentIndex);
            } else {
                swal('',
                    'No more slot requests at this time. Check back later.',
                    'info'
                ).then(() => {
                }, (dismiss) => {
                });
            }
        });
    }

    private showSlotAssignmentModal(comments: any, commentIndex: number) {
        this.modal.open(SlotConfirmationModalComponent,
            overlayConfigFactory({
                            isBlocking: false,
                            comment: comments[commentIndex],
                            callingComponent: this,
                            numOpenSlots: this.numOpenSlots
                        },
                        BSModalContext))
            .then( dialogRef => {
                dialogRef.result.then( result => {
                    if (result && result.slotAssignments && result.slotAssignments.length > 0) {
                        this.sendConfirmationReply(this.assignSlots(result.slotAssignments), result.confirmationMessageText, comments[commentIndex].data.name);
                    }

                    if (result) {
                        this.confirmedComments.push(comments[commentIndex].data.name);

                        localStorage.setItem(this.currentRaffle.name + '_confirmedComments', JSON.stringify(this.confirmedComments));
                        if (commentIndex < comments.length - 1) {
                            this.showSlotAssignmentModal(comments, commentIndex + 1);
                        } else {
                            //check if more comments since start of wizard
                            this.slotAssignmentWizard();
                        }
                    }
                }).catch(error => console.log(error));
        });
    }

    private assignSlots(slotAssignments: any): any {
        const assignedSlots = [];

        for (let i = 0; i < slotAssignments.length; i++) {
            const slotAssignment = slotAssignments[i];
            let slotsToAssignString = slotAssignment.calledSlots;

            assignedSlots.push({assignee: slotAssignment.username, calledSlots: [], randomSlots: []});

            if (slotsToAssignString) {
                slotsToAssignString = slotsToAssignString.replace(/\s+/g, '');
                const slotsToAssign = slotsToAssignString.split(',');
                for (let x = 0; x < slotsToAssign.length; x++) {
                    const calledSlot = slotsToAssign[x];
                    assignedSlots[i].calledSlots.push(+calledSlot);
                    this.assignSlot(slotAssignment.username, calledSlot, false, false);
                }
            }
        }

        for (let i = 0; i < slotAssignments.length; i++) {
            const slotAssignment = slotAssignments[i];
            if (slotAssignment.randomSlots) {
                for (let x = 0; x < slotAssignment.randomSlots; x++) {
                    this.getRandomUnclaimedSlotNumber().subscribe(randomSlot => {
                        if (randomSlot) {
                            assignedSlots[i].randomSlots.push(randomSlot);
                            this.assignSlot(slotAssignment.username, randomSlot, false, false);
                        }
                    });
                }
            }
        }

        this.updateCommentText();

        return assignedSlots;
    }

    public isSlotAvailable(slotNumber: number): boolean {
        if (slotNumber > 0 && slotNumber <= this.raffleParticipants.length) {
            if (this.raffleParticipants[slotNumber - 1].name) {
                return false;
            }
        } else {
            return false;
        }

        return true;
    }

    private assignSlot(username: string, slotNumber: number, forceAssignment: boolean, updateText: boolean) {
        if (this.isSlotAvailable(slotNumber) || forceAssignment) {
            this.raffleParticipants[slotNumber - 1].name = username;
            if (updateText) {
                this.updateCommentText();
            }
            this.sendPayPalPm(username);
        }
    }

    private sendConfirmationReply(slotAssignments: any, confirmationMessage: string, commentId: string) {
        this.redditService.postComment(this.getCommentText(slotAssignments, confirmationMessage), commentId).subscribe( response => {
            if (!response || !response.json || !response.json.data || !response.json.errors || response.json.errors.length) {
                console.error('error sending confirmation response', response);
                alert('Unable to send confirmation message. please do so manually.');
            }
        },
            error => {
                console.error('error sending confirmation response', error);
                alert('Unable to send confirmation message. please do so manually.');
            });
    }

    private getCommentText(slotAssignments: any, commentText: string): string {
        let updatedText = commentText;
        for (let x = 0; x < slotAssignments.length; x++) {
            const slotAssignment = slotAssignments[x];
            const allSlots = slotAssignment.calledSlots.join(', ') + (slotAssignment.calledSlots.length ? ', ' : '') + slotAssignment.randomSlots.join(', ');
            updatedText = updatedText.replace(new RegExp('{' + slotAssignment.assignee + '_ALL_SLOTS' + '}', 'ig'), allSlots);
            updatedText = updatedText.replace(new RegExp('{' + slotAssignment.assignee + '_CALLED_SLOTS' + '}', 'ig'), slotAssignment.calledSlots.join(', '));
            updatedText = updatedText.replace(new RegExp('{' + slotAssignment.assignee + '_RANDOM_SLOTS' + '}', 'ig'), slotAssignment.randomSlots.join(', '));
        }

        return updatedText;
    }

    private loadStorage(raffleName: string) {
        const confirmedComments = JSON.parse(localStorage.getItem(raffleName + '_confirmedComments'));
        if (confirmedComments !== null) {
            this.confirmedComments = confirmedComments;
        }

        const skippedPms = JSON.parse(localStorage.getItem(raffleName + '_skippedPms'));
        if (skippedPms !== null) {
            this.skippedPms = skippedPms;
        }
        const shownNewFeatureMessageSlotAssignmentHelper = JSON.parse(localStorage.getItem('shownNewFeatureMessageSlotAssignmentHelper'));
        if (shownNewFeatureMessageSlotAssignmentHelper !== null) {
            this.shownNewFeatureMessageSlotAssignmentHelper = shownNewFeatureMessageSlotAssignmentHelper;
        }
    }

    private showNewFeatureMessage() {
        if (!this.shownNewFeatureMessageSlotAssignmentHelper) {
            swal({
                    title: 'New Feature Available!',
                    html:   '<h3><span style="font-weight: 400;">' +
                                'Slot Assignment Helper' +
                            '</span></h3>' +
                            '<p><span style="font-weight: 400;">' +
                                'Clicking the "Slot Assignment Helper" button will cycle you through top level comments and provide ' +
                                'you with an interface to assign slots and reply to the request with a confirmation message ' +
                                'all without having to leave The Raffle Tool.' +
                            '</span></p>' +
                            '<p><span style="font-weight: 400;">' +
                                'See the <a href="https://docs.google.com/document/d/1lz07G4-So9sUXgp46FWY-i7DSJ_RCfGfrBtIU1xNQbw/edit#heading=h.sg5104iphu6x" target="_blank" rel="noopener">complete documentation</a>&nbsp;for more info.' +
                            '</span></p>',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                }
            ).then(() => {
                localStorage.setItem('shownNewFeatureMessageSlotAssignmentHelper', JSON.stringify(true));
            }, (dismiss) => { localStorage.setItem(this.currentRaffle.name + '_shownNewFeatureMessageSlotAssignmentHelper', JSON.stringify(true));
            });
        }
    }

    private showModAppreciationMessage() {
        if (this.isModtober) {
            swal({
                    title: 'Modtober is here!',
                    html: '<h3><span style="font-weight: 400;">October is mod appreciation month!</span></h3>\n' +
                    '<p><span style="font-weight: 400;">' +
                        '   <strong>The mods donate a lot of their time</strong> to ensure the community we have here is fun, fair, and safe.' +
                        ' You can <strong>show your appreciation</strong> by donating a slot from your raffle to a random mod of /r/' +
                        this.currentRaffle.subreddit +
                        ' by clicking the button below. <br/> <br/>This will post a comment to your raffle stating you are donating a slot. You should process the request normally.' +
                    '</span></p>',
                    showCloseButton: true,
                    showCancelButton: true,
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Donate Slot!'
                }
            ).then(() => {
                this.donateModSlot();
            }, (dismiss) => {
            });
        }
    }

    private selectRaffle(raffles: any): any {
        return Observable.create(observer => {
            if (raffles && raffles.length > 1) {
                this.modal.open(RafflePickerModalComponent,
                    overlayConfigFactory({
                            isBlocking: true,
                            raffles: raffles
                        },
                        BSModalContext))
                    .then(dialogRef => {
                        dialogRef.result.then(raffle => {
                            observer.next(raffle);
                            observer.complete();
                        }).catch(err => {
                            console.error(err);
                            observer.error(err);
                            observer.complete();
                        });
                    });
            } else if (raffles && raffles.length === 1) {
                observer.next(raffles[0]);
                observer.complete();
            } else {
                observer.next({});
                observer.complete();
            }

        });

    }

    private donateModSlot() {
        const mod = this.getRandomMod(this.currentRaffle.subreddit);

        const randomModUrl = this.raffleToolUri + '?modtober_subreddit=' + this.currentRaffle.subreddit;

        const commentText = '#Modtober Is Here!!!\n\n' +
            '/u/BoyAndHisBlob has declared October mod appreciation month in The Raffle Tool. All rafflers and their participants ' +
            'are encouraged to **show appreciation for a [random mod](' + randomModUrl + ')** by donating a slot to them.\n\n' +
            'In the spirit of Modtober I am donating a random slot to /u/' + mod + ' as a thank you for all the time and effort ' +
            'they donate to make /r/' + this.currentRaffle.subreddit + ' a fun, fair, and safe community for everyone.' +
            '\n\nThis slot request will be processed in the order it was received in the queue.';

        this.redditService.postComment(commentText, this.currentRaffle.name).subscribe(response => {
            swal(
                'Donation Comment Posted!',
                'Please process the slot request in the order it was recieved in the queue and thank you for your generosity!',
                'success'
            ).then(() => {
            }, (dismiss) => {
            });
        });
    }

    private getRandomMod(subreddit: string): string {
        const subredditMods = this.mods[subreddit];

        if(subredditMods && subredditMods.length) {
            const min = 0;
            const max = subredditMods.length - 1;
            const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

            return subredditMods[randomNum];
        } else {
            return null;
        }
    }

    private loadRaffle() {
        this.redditService.getUserDetails().subscribe(userDetailsResponse => {
                if (userDetailsResponse.name) {
                    this.userName = userDetailsResponse.name;

                    this.redditService.getCurrentRaffleSubmissions(userDetailsResponse.name)
                        .subscribe(submissionsResponse => {
                                if (submissionsResponse && submissionsResponse.length > 0) {
                                    this.selectRaffle(submissionsResponse).subscribe(submission => {
                                        this.currentRaffle = submission;
                                        this.importRaffleSlots(submission);

                                        this.loadStorage(submission.name);

                                        this.showNewFeatureMessage();
                                        this.showModAppreciationMessage();
                                    });
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
    }

    private showModtoberModMessage(subreddit: string) {
        const randomMod = this.getRandomMod(subreddit);

        const randomModUrl = this.raffleToolUri + '?modtober_subreddit=' + subreddit;

        if (randomMod) {
            swal({
                    title: 'Modtober is here!',
                    html: '<h3 class="text-left"><span style="font-weight: 400;">' + randomMod + ' is your random mod! ' +
                    'Click the "Copy And Close" button to copy suggested comment text to your clipboard so you can paste it into a Reddit comment.</span></h3>\n',
                    showCloseButton: true,
                    showCancelButton: true,
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Copy And Close'
                }
            ).then(() => {
                const commentText = '#Modtober Is Here!!!\n\n' +
                    '/u/BoyAndHisBlob has declared October mod appreciation month in The Raffle Tool. All rafflers and their participants ' +
                    'are encouraged to **show appreciation for a [random mod](' + randomModUrl + ')** by donating a slot to them.\n\n' +
                    'In the spirit of Modtober **I am requesting a random slot for /u/' + randomMod + '** as a thank you for all the time and effort ' +
                    'they donate to make /r/' + subreddit + ' a fun, fair, and safe community for everyone.';

                let dummy = document.createElement('textarea');
                document.body.appendChild(dummy);
                dummy.setAttribute('id', 'dummy_id');
                const commentControl: any = document.getElementById('dummy_id');
                commentControl.value = commentText;
                dummy.select();
                document.execCommand('copy');
                document.body.removeChild(dummy);

            }, (dismiss) => {
            });
        }
    }

}
