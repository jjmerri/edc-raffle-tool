import { Component, OnInit } from '@angular/core';
import { CloseGuard, DialogRef, ModalComponent } from 'ngx-modialog';
import { BSModalContext } from 'ngx-modialog/plugins/bootstrap';

export class TermsOfServiceModalContext extends BSModalContext {}

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.modal.component.html',
})
export class TermsOfServiceModalComponent implements OnInit, ModalComponent<TermsOfServiceModalContext> {
  private context: TermsOfServiceModalContext;

  constructor(public dialog: DialogRef<TermsOfServiceModalContext>) {
    this.context = dialog.context;
  }

  ngOnInit() {}

  public closeModal(result: any) {
    this.dialog.close(result);
  }
}
