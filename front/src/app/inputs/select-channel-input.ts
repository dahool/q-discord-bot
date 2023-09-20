import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, forwardRef } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'select-channel-input',
  standalone: true,
  templateUrl: 'select-channel-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule, NgSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectChannelInputComponent),
      multi: true,
    },
  ],  
})
export class SelectChannelInputComponent implements ControlValueAccessor, OnInit {

  //@ts-ignore
  @Input() options: Map<any[], any[]>;
  @Input() formControlName: string = '';
  @Input("multiple") isMultiple: boolean = false;
  @Input("ngModel") model: any;
  @Output("ngModelChange") modelChange = new EventEmitter<any>();
  @Output("change") onChange = new EventEmitter<any>();

  _onChange = (_: any ) => {};
  _onTouched = () => {};

  ngOnInit(): void {
      if (this.formControlName == '' || this.formControlName == undefined) {
          this.formControlName = "select-channel-input-" + Math.random().toString(36).substring(2, 9);
      }
  }
  
  onValueUpdate(value: any) {
    this.onChange.emit(value);
    this.modelChange.emit(value);
    this._onChange(value);
  }  

  writeValue(obj: any) {
    this.model = obj;
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {}

}