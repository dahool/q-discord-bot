import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input, OnInit, forwardRef } from "@angular/core";
import { CheckboxControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: 'toggle-switch-input',
  standalone: true,
  template: `
  <label class="switch">
    <input name="{{formControlName}}" type="checkbox" [checked]="checked">
    <span class="slider round"></span>
  </label>
  `,
  styleUrls: ['toggle-switch-input.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchInputComponent),
      multi: true,
    },
  ],    
})
export class ToggleSwitchInputComponent extends CheckboxControlValueAccessor implements OnInit {

  @Input() formControlName: string = '';

  private _checked: boolean = false;

  ngOnInit(): void {
      if (this.formControlName == '' || this.formControlName == undefined) {
          this.formControlName = "toggle-switch-" + Math.random().toString(36).substring(2, 9);
      }
  }

  writeValue(value: any): void {
      this._checked = value;
  }

  public get checked() {
    return this._checked;
  }

}