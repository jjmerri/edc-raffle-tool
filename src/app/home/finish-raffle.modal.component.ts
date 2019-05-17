
import { Component, OnInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class FinishRaffleModalContext extends BSModalContext {
    public raffleParticipants: any[];
    public raffle: any;
}

@Component({
    selector: 'app-raffle-picker',
    templateUrl: './finish-raffle.modal.component.html',
    styleUrls: ['./finish-raffle.modal.component.css']
})
export class FinishRaffleModalComponent implements OnInit, ModalComponent<FinishRaffleModalContext> {
    private context: FinishRaffleModalContext;
    private raffle: any;
    private totalCost: number;
    private totalDiscounts = 0;
    private winner: string;
    private raffleParticipants: any[];
    private winnerPm: string;
    private modPm: string;
    private modPmNotes: string;
    private winningSlot: number;
    private winnerPlaceholder = '{WINNER_PLACEHOLDER}'
    private permalinkPlaceholder = '{PERMALINK_PLACEHOLDER}'
    private winnersContributionPlaceholder = '{WINNERSCONTRIBUTION_PLACEHOLDER}'
    private totalCostPlaceholder = '{TOTALCOST_PLACEHOLDER}'
    private totalDiscountsPlaceholder = '{TOTALDISCOUNTS_PLACEHOLDER}'
    private numSlotsPlaceholder = '{NUMSLOTS_PLACEHOLDER}'
    private numWinnerSlotsPlaceholder = '{NUMWINNERSLOTS_PLACEHOLDER}'
    private datePlaceholder = '{DATE_PLACEHOLDER}'
    private opPlaceholder = '{OP_PLACEHOLDER}'

    private calculationMessage = 'The sub fund contribution is calculated as follows:\n\n' +
        '    total cost = $' + this.totalCostPlaceholder + '\n\n' +
        '    discounts = $' + this.totalDiscountsPlaceholder + '\n\n' +
        '    total num spots = ' + this.numSlotsPlaceholder + '\n\n' +
        '    num winner spots = ' + this.numWinnerSlotsPlaceholder + '\n\n' +
        '    (' + this.totalCostPlaceholder + ' - ' + this.totalDiscountsPlaceholder +
        ' - ((' + this.totalCostPlaceholder + '/' + this.numSlotsPlaceholder + ') * ' + this.numWinnerSlotsPlaceholder +
        ')) * 1% = ' + this.winnersContributionPlaceholder;
    private pmDefault = 'Congrats on your win ' + this.winnerPlaceholder + '! [Per sub rules](https://www.reddit.com/r/WatchURaffle/wiki/rules#wiki_winners), I am required to collect the sub fund contribution from you before anything is shipped. ' +
        'Please send **$' + this.winnersContributionPlaceholder + '** to the same PayPal that you sent raffle payment to.\n\n' + this.calculationMessage
    private infoTable = 'DATE | RAFFLE | VALUE | SPOTS | TIX | DISCOUNTS | WINNER | OP/ESCROW\n' +
                            '---|---|----|----|----|----|----|----\n' +
                            this.datePlaceholder + ' | ' + this.permalinkPlaceholder + ' | ' + this.totalCostPlaceholder + ' | ' + this.numSlotsPlaceholder + ' | ' + this.numWinnerSlotsPlaceholder + ' | ' + this.totalDiscountsPlaceholder + ' | ' + this.winnerPlaceholder + ' | ' + this.opPlaceholder;

    constructor(public dialog: DialogRef<FinishRaffleModalContext>) {
        this.context = dialog.context;
    }

    ngOnInit() {
        this.raffleParticipants = this.context.raffleParticipants;
        this.raffle = this.context.raffle;
        this.winnerPm = this.pmDefault
        this.modPm = this.infoTable
    }

    private updateMessages() {
        let numWinnerSlots = 0;
        if (this.winningSlot && this.winningSlot <= this.raffleParticipants.length && this.winningSlot > 0 && (this.winningSlot % 1 === 0)) {
            this.winner = this.raffleParticipants[this.winningSlot - 1].name
        } else {
            this.winner = '';
        }

        for (let x = 0; x < this.raffleParticipants.length; x++) {
            if (this.raffleParticipants[x].name && this.winner && this.raffleParticipants[x].name.toUpperCase() === this.winner.toUpperCase()) {
                numWinnerSlots++;
            }
        }

        let winnersContribution = (this.totalCost - this.totalDiscounts - ((this.totalCost / this.raffleParticipants.length) * numWinnerSlots)) * .01

        if (winnersContribution < 0) {
            winnersContribution = 0;
        }

        if (!this.winner || !this.totalCost) {
            return;
        }

        this.winnerPm = this.pmDefault.replace(new RegExp(this.winnerPlaceholder, 'ig'), this.winner);
        this.winnerPm = this.winnerPm.replace(new RegExp(this.winnersContributionPlaceholder, 'ig'), winnersContribution.toFixed(2));
        this.winnerPm = this.winnerPm.replace(new RegExp(this.totalCostPlaceholder, 'ig'), this.totalCost.toFixed(2));
        this.winnerPm = this.winnerPm.replace(new RegExp(this.totalDiscountsPlaceholder, 'ig'), this.totalDiscounts.toFixed(2));
        this.winnerPm = this.winnerPm.replace(new RegExp(this.numSlotsPlaceholder, 'ig'), this.raffleParticipants.length.toString());
        this.winnerPm = this.winnerPm.replace(new RegExp(this.numWinnerSlotsPlaceholder, 'ig'), numWinnerSlots.toString());

        this.modPm = this.winnerPm + '\n\n' + this.infoTable + (this.modPmNotes ? '\n\nNOTES:\n\n' + this.modPmNotes : '')
        this.modPm = this.modPm.replace(new RegExp(this.permalinkPlaceholder, 'ig'), this.raffle.permalink);
        this.modPm = this.modPm.replace(new RegExp(this.winnerPlaceholder, 'ig'), '/u/' + this.winner);
        this.modPm = this.modPm.replace(new RegExp(this.opPlaceholder, 'ig'), '/u/' + this.raffle.author);
        this.modPm = this.modPm.replace(new RegExp(this.totalCostPlaceholder, 'ig'), this.totalCost.toFixed(2));
        this.modPm = this.modPm.replace(new RegExp(this.totalDiscountsPlaceholder, 'ig'), this.totalDiscounts.toFixed(2));
        this.modPm = this.modPm.replace(new RegExp(this.numSlotsPlaceholder, 'ig'), this.raffleParticipants.length.toString());
        this.modPm = this.modPm.replace(new RegExp(this.numWinnerSlotsPlaceholder, 'ig'), numWinnerSlots.toString());
        this.modPm = this.modPm.replace(new RegExp(this.datePlaceholder, 'ig'), this.getCurrentDate());
        this.modPm = this.modPm.replace(new RegExp(this.winnersContributionPlaceholder, 'ig'), winnersContribution.toFixed(2));
    }

    private finishRaffle() {
        this.dialog.close({winnerPm: this.winnerPm,
                                 winner: this.winner,
                                 modPm: this.modPm
        });
    }

    private closeModal() {
        this.dialog.close();
    }

    private getCurrentDate(): string {
        const dateParts = new Date().toISOString().slice(0, 10).split('-')

        return dateParts[1] + '/' + dateParts[2] + '/' + dateParts[0];
    }
}