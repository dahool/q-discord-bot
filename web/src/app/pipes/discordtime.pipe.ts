import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

export const DISCORD_FORMATS = new Map<string, string>();
DISCORD_FORMATS.set('f', 'DDD t');
DISCORD_FORMATS.set('F', 'DDDD t');
DISCORD_FORMATS.set('d', 'D');
DISCORD_FORMATS.set('D', 'DDD');
DISCORD_FORMATS.set('t', 't');
DISCORD_FORMATS.set('T', 'tt');
DISCORD_FORMATS.set('R', '');

@Pipe({
  name: 'discordTime',
  standalone: true
})
export class DiscordTimePipe implements PipeTransform {

  transform(value: DateTime | Date, format: string): string {
    let dt = (value instanceof Date) ? DateTime.fromJSDate(value) : value;
    return '<t:' + Math.trunc(dt.toSeconds()) + ':' + format + '>'
  }

}

@Pipe({
  name: 'discordTimeDisplay',
  standalone: true
})
export class DiscordTimeDisplayPipe implements PipeTransform {

  transform(value: DateTime | Date, format: string): string | null {
    let dt = (value instanceof Date) ? DateTime.fromJSDate(value) : value;
    if (format == 'R') {
      return dt.toRelative();
    }
    return dt.toFormat(DISCORD_FORMATS.get(format)!);
  }

}
