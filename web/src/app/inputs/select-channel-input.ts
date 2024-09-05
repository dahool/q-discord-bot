import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild, forwardRef } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';

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
export class SelectChannelInputComponent implements  ControlValueAccessor, OnInit {

  @Input() formControlName: string = '';
  @Input("options") channelList: any[] = [];
  @Input("multiple") isMultiple: boolean = false;

  @Output("change") onChange = new EventEmitter<any>();

  @ViewChild('inputField', { static: true })
  field!: NgSelectComponent;

  _onChange = (_: any ) => {};
  _onTouched = () => {};

  constructor(private injector: Injector) {}

  ngOnInit(): void {
      if (this.formControlName == '' || this.formControlName == undefined) {
          this.formControlName = "select-channel-input-" + Math.random().toString(36).substring(2, 9);
      }
  }

  onValueUpdate(value: any) {
    let publish;
    if (Array.isArray(value)) {
      publish = value.map(v => v.id);
    } else if (value) {
      publish = value.id;
    }
    this.onChange.emit(publish);
    this._onChange(publish);
  }

  writeValue(obj: any) {
    this.field.writeValue(obj);
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.field.setDisabledState(isDisabled);
  }

}
