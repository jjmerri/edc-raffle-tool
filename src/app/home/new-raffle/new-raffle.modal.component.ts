import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DialogRef, ModalComponent, overlayConfigFactory } from 'ngx-modialog';
import { BSModalContext, Modal } from 'ngx-modialog/plugins/bootstrap';

import { ConfirmNewRaffleModalComponent } from './confirm-new-raffle.modal.component';

export class NewRaffleModalContext extends BSModalContext {
  public subs: string[];
}

@Component({
  selector: 'app-new-raffle',
  templateUrl: './new-raffle.modal.component.html',
  styleUrls: ['./new-raffle.modal.component.css']
})
export class NewRaffleModalComponent
  implements OnInit, ModalComponent<NewRaffleModalContext> {
  private context: NewRaffleModalContext;

  public subs: string[];
  public locations = ['USA', 'CAN', 'Other'];
  public raffleTypes = [
    'Giveaway',
    'Charity',
    'Step',
    'NM',
    'Blue',
    'Main',
    'Gold',
    'Custom'
  ];

  newRaffleForm = new FormGroup({
    subreddit: new FormControl('placeholder', [
      Validators.pattern(/\b(?!placeholder)\b\S+/)
    ]),
    sellerUsername: new FormControl('', [Validators.required]),
    itemName: new FormControl('', [Validators.required]),
    raffleType: new FormControl('placeholder', [
      Validators.pattern(/\b(?!placeholder)\b\S+/)
    ]),
    customType: new FormControl({ value: '', disabled: true }),
    numSlots: new FormControl(null, [Validators.required]),
    slotCost: new FormControl(null, [Validators.required]),
    approvalLink: new FormControl(''),
    previousRaffle: new FormControl(''),
    priceJustification1: new FormControl(''),
    priceJustification2: new FormControl(''),
    priceJustification3: new FormControl(''),
    priceJustification4: new FormControl(''),
    location: new FormControl('placeholder', [
      Validators.pattern(/\b(?!placeholder)\b\S+/)
    ]),
    otherLocation: new FormControl({ value: '', disabled: true }),
    shipping: new FormControl('', [Validators.required]),
    images: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required])
  });

  constructor(
    public dialog: DialogRef<NewRaffleModalContext>,
    private modal: Modal
  ) {
    this.context = dialog.context;
  }

  ngOnInit() {
    this.subs = this.context.subs;
    this.subscribeToFieldChanges();
  }

  private submitRaffle() {
    if (this.newRaffleForm.valid) {
      this.openNewRaffleModal();
    } else {
      this.validateAllFormFields(this.newRaffleForm);
    }
  }

  private closeModal() {
    this.dialog.close();
  }

  private subscribeToFieldChanges() {
    this.newRaffleForm.controls.raffleType.valueChanges.subscribe(
      this.raffleTypeChange
    );
    this.newRaffleForm.controls.location.valueChanges.subscribe(
      this.locationChange
    );
  }

  private raffleTypeChange = () => {
    if (this.newRaffleForm.controls.raffleType.value === 'Custom') {
      this.newRaffleForm.controls.customType.enable();
    } else {
      this.newRaffleForm.controls.customType.disable();
      this.newRaffleForm.controls.customType.setValue('');
    }
  };

  private locationChange = () => {
    if (this.newRaffleForm.controls.location.value === 'Other') {
      this.newRaffleForm.controls.otherLocation.enable();
    } else {
      this.newRaffleForm.controls.otherLocation.disable();
      this.newRaffleForm.controls.otherLocation.setValue('');
    }
  };

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  private openNewRaffleModal() {
    this.modal
      .open(
        ConfirmNewRaffleModalComponent,
        overlayConfigFactory(
          {
            isBlocking: true,
            raffleForm: this.newRaffleForm.value
          },
          BSModalContext
        )
      )
      .then(dialogRef => {
        dialogRef.result
          .then(newRaffle => {
            if (newRaffle) {
              this.dialog.close(newRaffle);
            }
          })
          .catch(err => {
            console.error(err);
          });
      });
  }
}
