import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService, parseDate } from './base.service';
import { Channel, Config, Guild, Role, SaveResponse, Schedule, Territory, User, UserServer } from './models';
import { IAppService } from '.';
import { DateTime } from 'luxon';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppServiceMock implements IAppService {

  listServers(): Observable<UserServer[]> {
    return of([
      {
        id: "695281624786534420",
        name: "TEST-1",
        icon: "https://i.postimg.cc/4NNSL1Vw/image.png"
      },
      {
        id: "700723065524584599",
        name: "TEST-2",
        icon: "https://i.postimg.cc/BQYwd1C3/image.png"
      },
      {
        id: "872582478206996581",
        name: "TEST-3",
        icon: "https://i.postimg.cc/3xzfw56b/image.png"
      }
    ]);
  }

  listChannels(id: string): Observable<Channel[]> {
    return of([
      {
        id: "872582478206996584",
        name: "general",
        parent: "Text Channels"
      },
      {
        id: "1128341026734624819",
        name: "rules"
      },
      {
        id: "1128341026734624820",
        name: "moderator-only"
      },
      {
        id: "1128341116148781177",
        name: "forum-channel",
        parent: "Text Channels"
      }
    ]);
  }

  listRoles(id: string): Observable<Role[]> {
    return of([
      {
        id: "904818434267836457",
        name: "TheContinuum"
      },
      {
        id: "1004011893666615308",
        name: "TestPlayground"
      },
      {
        id: "1114928165056413729",
        name: "Pancake"
      }
    ]);
  }

  getEvents(id: string): Observable<Schedule[]> {
    return of([
      {
        _id: "66c37d4385c1eac8ad0cdfdd",
        guild: "872582478206996581",
        type: "territory",
        summary: "TEST",
        location: "Anzat",
        duration: 30,
        pingRoles: [],
        parentId: "66c37d4285c1eac8ad0cdfdb",
        notified: false,
        recurrent: false,
        __v: 0,
        id: "66c37d4385c1eac8ad0cdfdd",
        dtStart: DateTime.now(),
        dtEnd: DateTime.now().plus({minutes: 30})
      }
    ]);
  }

  getServer(id: string): Observable<Guild> {
    return of({
      id: "695281624786534420",
      name: "TEST-1",
      icon: "https://i.postimg.cc/4NNSL1Vw/image.png"
    });
  }

  getConfig(server: string): Observable<Config> {
    return of({
      channels: {
        logging: "1184862688803819641",
        territory: "1026865768492699779",
        dailyTerritory: "1026865768492699779",
        scheduledEvents: "1026865768492699779",
        announcements: "1026865768492699779"
      },
      welcomeBye: {
        join: {
          message: "Hey {user}, welcome to **{server}**! Someone will be with you shortly",
          message2: "Hey {user}, welcome BACK! 😎",
          active: true,
          channel: "1026865768492699779",
          roles: []
        },
        leaves: {
          channel: "1026865768492699779",
          active: true,
          message: "Goodbye {name} with user {user}"
        }
      },
      guild: "695281624786534420",
      name: "NoMachine's server",
      newThreadAnnouncer: [
        {
          channels: [
            "847549004447613008",
            "809857683116261417"
          ],
          announceChannel: "847549004447613008",
          message: "test",
        }
      ],
      allianceTag: "IRON",
      territoyCalendar: "https://calendar.google.com/calendar/ical/stfccalendar%40gmail.com/public/basic.ics",
      autoFollowThreadChannels: [
        {
          channel: "1154396344597889024",
          silent: false
        },
      ],
      translateChannels: [
        {
          channel: "1154396344597889024",
          language: "es",
        }
      ]
    });
  }

  saveConfig(server: string, data: Config):  Observable<SaveResponse> {
    return of({status :true, error: ''});
  }

  getProfile(): Observable<User> {
    return of({
      username: "nomachine",
      icon: "https://cdn.discordapp.com/avatars/662674908492333056/89f3907daa1e231122a9d56f82b227a8.webp?size=128"
    })
  }

  listZones(): Observable<Territory[]> {
    return of([
      {
        next: "2024-08-20T01:00:40.815Z",
        zone: "Abilakk",
        type: 2,
        weekday: 2,
        time: "0100",
        particle: "Phantom",
        rss: [
          "crystal3",
          "iso3"
        ],
        paths: [
          "Tholus",
          "Lenara",
          "Anzat"
        ]
      },
      {
        next: "2024-08-21T16:00:40.815Z",
        zone: "Adia",
        type: 1,
        weekday: 3,
        time: "1600",
        particle: "Phantom",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Tezera",
          "Crios"
        ]
      },
      {
        next: "2024-08-23T00:00:40.815Z",
        zone: "Anzat",
        type: 2,
        weekday: 5,
        time: "0000",
        particle: "Phantom",
        rss: [
          "iso3",
          "crystal3"
        ],
        paths: [
          "Tazolka",
          "Abilakk",
          "Tholus",
          "Parturi"
        ]
      },
      {
        next: "2024-08-25T21:00:40.815Z",
        zone: "Aonad",
        type: 1,
        weekday: 7,
        time: "2100",
        particle: "Quantum",
        rss: [
          "iso2",
          "tritanium"
        ],
        paths: [
          "Comst",
          "Ruhe",
          "Otima"
        ]
      },
      {
        next: "2024-08-21T20:00:40.815Z",
        zone: "Asiti",
        type: 1,
        weekday: 3,
        time: "2000",
        particle: "Surax",
        rss: [
          "iso2",
          "dilithium"
        ],
        paths: [
          "Parturi",
          "Kolava",
          "Qeyma"
        ]
      },
      {
        next: "2024-08-22T18:00:40.815Z",
        zone: "Avansa",
        type: 2,
        weekday: 4,
        time: "1800",
        particle: "Quantum",
        rss: [
          "iso3",
          "ore3"
        ],
        paths: [
          "Ruhe",
          "Roshar",
          "Otima",
          "Corva"
        ]
      },
      {
        next: "2024-08-26T01:00:40.815Z",
        zone: "Aylus",
        type: 1,
        weekday: 1,
        time: "0100",
        particle: "Phantom",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Thosz",
          "Duportas",
          "Tazolka"
        ]
      },
      {
        next: "2024-08-24T23:00:40.815Z",
        zone: "Barasa",
        type: 3,
        weekday: 6,
        time: "2300",
        particle: "Surax",
        rss: [
          "ore3",
          "ore4"
        ],
        paths: [
          "Brijac",
          "Bolari",
          "Burran"
        ]
      },
      {
        next: "2024-08-23T22:00:40.816Z",
        zone: "Beku",
        type: 1,
        weekday: 5,
        time: "2200",
        particle: "Phantom",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Bimasa",
          "Brijac",
          "Gelida"
        ]
      },
      {
        next: "2024-08-23T01:00:40.816Z",
        zone: "Ber'Tho",
        type: 2,
        weekday: 5,
        time: "0100",
        particle: "Phantom",
        rss: [
          "iso3",
          "crystal3"
        ],
        paths: [
          "Brellan",
          "Duportas",
          "Zamaro",
          "Tazolka"
        ]
      },
      {
        next: "2024-08-19T22:00:40.816Z",
        zone: "Bimasa",
        type: 2,
        weekday: 1,
        time: "2200",
        particle: "Phantom",
        rss: [
          "crystal3",
          "iso3"
        ],
        paths: [
          "Brellan",
          "Beku",
          "Zamaro",
          "Gelida"
        ]
      },
      {
        next: "2024-08-19T20:00:40.816Z",
        zone: "Bolari",
        type: 2,
        weekday: 1,
        time: "2000",
        particle: "Surax",
        rss: [
          "iso3",
          "ore3"
        ],
        paths: [
          "Parturi",
          "Kolava",
          "Brijac",
          "Barasa"
        ]
      },
      {
        next: "2024-08-25T01:00:40.816Z",
        zone: "Brellan",
        type: 3,
        weekday: 7,
        time: "0100",
        particle: "Phantom",
        rss: [
          "crystal3",
          "crystal4"
        ],
        paths: [
          "Duportas",
          "Bimasa",
          "Ber'tho"
        ]
      },
      {
        next: "2024-08-22T21:00:40.816Z",
        zone: "Brijac",
        type: 2,
        weekday: 4,
        time: "2100",
        particle: "Surax",
        rss: [
          "iso3",
          "ore3"
        ],
        paths: [
          "Beku",
          "Saldeti",
          "Bolari",
          "Barasa"
        ]
      },
      {
        next: "2024-08-22T19:00:40.816Z",
        zone: "Burran",
        type: 2,
        weekday: 4,
        time: "1900",
        particle: "Surax",
        rss: [
          "iso3",
          "ore3"
        ],
        paths: [
          "Barasa",
          "Stilhe",
          "Thaylen",
          "Comst"
        ]
      },
      {
        next: "2024-08-23T16:00:40.816Z",
        zone: "Comst",
        type: 1,
        weekday: 5,
        time: "1600",
        particle: "Quantum",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Burran",
          "Thaylen",
          "Aonad"
        ]
      },
      {
        next: "2024-08-24T21:00:40.816Z",
        zone: "Corva",
        type: 3,
        weekday: 6,
        time: "2100",
        particle: "Quantum",
        rss: [
          "ore3",
          "ore4"
        ],
        paths: [
          "Crios",
          "Roshar",
          "Avansa"
        ]
      },
      {
        next: "2024-08-19T19:00:40.817Z",
        zone: "Crios",
        type: 2,
        weekday: 1,
        time: "1900",
        particle: "Quantum",
        rss: [
          "iso3",
          "ore3"
        ],
        paths: [
          "Qeyma",
          "Adia",
          "Corva",
          "Stilhe"
        ]
      },
      {
        next: "2024-08-19T23:00:40.817Z",
        zone: "Duportas",
        type: 2,
        weekday: 1,
        time: "2300",
        particle: "Phantom",
        rss: [
          "iso3",
          "crystal3"
        ],
        paths: [
          "Nujord",
          "Aylus",
          "Ber'tho",
          "Brellan"
        ]
      },
      {
        next: "2024-08-20T00:00:40.817Z",
        zone: "Eldur",
        type: 2,
        weekday: 2,
        time: "0000",
        particle: "Quantum",
        rss: [
          "iso3",
          "gas3"
        ],
        paths: [
          "Thosz",
          "Klefaski",
          "Hrojost",
          "Nyrheimur"
        ]
      },
      {
        next: "2024-08-23T20:00:40.817Z",
        zone: "Ezla",
        type: 1,
        weekday: 5,
        time: "2000",
        particle: "Surax",
        rss: [
          "iso2",
          "tritanium"
        ],
        paths: [
          "Hoobishan",
          "Temeri",
          "Perim"
        ]
      },
      {
        next: "2024-08-23T17:00:40.817Z",
        zone: "Framtid",
        type: 1,
        weekday: 5,
        time: "1700",
        particle: "Quantum",
        rss: [
          "iso2",
          "tritanium"
        ],
        paths: [
          "Innlasn",
          "Hrojost",
          "Nujord"
        ]
      },
      {
        next: "2024-08-25T17:00:40.817Z",
        zone: "Gelida",
        type: 1,
        weekday: 7,
        time: "1700",
        particle: "Phantom",
        rss: [
          "iso2",
          "tritanium"
        ],
        paths: [
          "Saldeti",
          "Beku",
          "Bimasa"
        ]
      },
      {
        next: "2024-08-25T20:00:40.817Z",
        zone: "Helvi",
        type: 1,
        weekday: 7,
        time: "2000",
        particle: "Quantum",
        rss: [
          "iso2",
          "parsteel"
        ],
        paths: [
          "Lenara",
          "Klefaski",
          "Zhian"
        ]
      },
      {
        next: "2024-08-26T17:00:40.817Z",
        zone: "Hoobishan",
        type: 2,
        weekday: 1,
        time: "1700",
        particle: "Surax",
        rss: [
          "iso3",
          "gas3"
        ],
        paths: [
          "Mak'ala",
          "Vemira",
          "Ezla",
          "Perim"
        ]
      },
      {
        next: "2024-08-22T22:00:40.817Z",
        zone: "Hrojost",
        type: 2,
        weekday: 4,
        time: "2200",
        particle: "Quantum",
        rss: [
          "iso3",
          "gas3"
        ],
        paths: [
          "Nyrheimur",
          "Framtid",
          "Nujord",
          "Eldur"
        ]
      },
      {
        next: "2024-08-25T18:00:40.817Z",
        zone: "Innlasn",
        type: 1,
        weekday: 7,
        time: "1800",
        particle: "Quantum",
        rss: [
          "iso2",
          "dilithium"
        ],
        paths: [
          "Framtid",
          "Vantar",
          "Tefkari"
        ]
      },
      {
        next: "2024-08-23T23:00:40.817Z",
        zone: "Klefaski",
        type: 1,
        weekday: 5,
        time: "2300",
        particle: "Quantum",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Vantar",
          "Eldur",
          "Helvi"
        ]
      },
      {
        next: "2024-08-23T21:00:40.817Z",
        zone: "Kolava",
        type: 1,
        weekday: 5,
        time: "2100",
        particle: "Surax",
        rss: [
          "iso2",
          "parsteel"
        ],
        paths: [
          "Bolari",
          "Qeyma",
          "Asiti"
        ]
      },
      {
        next: "2024-08-22T01:00:40.817Z",
        zone: "Lenara",
        type: 1,
        weekday: 4,
        time: "0100",
        particle: "Surax",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Helvi",
          "Triss",
          "Abilakk"
        ]
      },
      {
        next: "2024-08-24T20:00:40.817Z",
        zone: "Mak'ala",
        type: 3,
        weekday: 6,
        time: "2000",
        particle: "Surax",
        rss: [
          "gas3",
          "gas4"
        ],
        paths: [
          "Triss",
          "Zhian",
          "Hoobishan"
        ]
      },
      {
        next: "2024-08-21T22:00:40.817Z",
        zone: "Nujord",
        type: 1,
        weekday: 3,
        time: "2200",
        particle: "Phantom",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Nyrheimur",
          "Framtid",
          "Duportas"
        ]
      },
      {
        next: "2024-08-24T22:00:40.817Z",
        zone: "Nyrheimur",
        type: 3,
        weekday: 6,
        time: "2200",
        particle: "Quantum",
        rss: [
          "gas3",
          "gas4"
        ],
        paths: [
          "Hrojost",
          "Vantar",
          "Eldur"
        ]
      },
      {
        next: "2024-08-21T17:00:40.818Z",
        zone: "Otima",
        type: 1,
        weekday: 3,
        time: "1700",
        particle: "Quantum",
        rss: [
          "iso2",
          "parsteel"
        ],
        paths: [
          "Avansa",
          "Ruhe",
          "Aonad"
        ]
      },
      {
        next: "2024-08-26T00:00:40.818Z",
        zone: "Parturi",
        type: 1,
        weekday: 1,
        time: "0000",
        particle: "Surax",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Anzat",
          "Bolari",
          "Asiti"
        ]
      },
      {
        next: "2024-08-21T18:00:40.818Z",
        zone: "Perim",
        type: 1,
        weekday: 3,
        time: "1800",
        particle: "Surax",
        rss: [
          "iso2",
          "parsteel"
        ],
        paths: [
          "Hoobishan",
          "Temeri",
          "Ezla"
        ]
      },
      {
        next: "2024-08-25T16:00:40.818Z",
        zone: "Qeyma",
        type: 1,
        weekday: 7,
        time: "1600",
        particle: "Surax",
        rss: [
          "iso2",
          "tritanium"
        ],
        paths: [
          "Asiti",
          "Kolava",
          "Crios"
        ]
      },
      {
        next: "2024-08-19T21:00:40.818Z",
        zone: "Roshar",
        type: 2,
        weekday: 1,
        time: "2100",
        particle: "Quantum",
        rss: [
          "iso3",
          "ore3"
        ],
        paths: [
          "Corva",
          "Stilhe",
          "Thaylen",
          "Avansa"
        ]
      },
      {
        next: "2024-08-23T18:00:40.818Z",
        zone: "Ruhe",
        type: 1,
        weekday: 5,
        time: "1800",
        particle: "Quantum",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Aonad",
          "Avansa",
          "Otima"
        ]
      },
      {
        next: "2024-08-23T19:00:40.818Z",
        zone: "Saldeti",
        type: 1,
        weekday: 5,
        time: "1900",
        particle: "Phantom",
        rss: [
          "iso2",
          "parsteel"
        ],
        paths: [
          "Gelida",
          "Zamaro",
          "Brijac"
        ]
      },
      {
        next: "2024-08-25T23:00:40.818Z",
        zone: "Stilhe",
        type: 1,
        weekday: 7,
        time: "2300",
        particle: "Surax",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Crios",
          "Roshar",
          "Burran"
        ]
      },
      {
        next: "2024-08-24T00:00:40.818Z",
        zone: "Tazolka",
        type: 1,
        weekday: 6,
        time: "0000",
        particle: "Phantom",
        rss: [
          "iso2",
          "tritanium"
        ],
        paths: [
          "Aylus",
          "Ber'Tho",
          "Zamaro",
          "Anzat"
        ]
      },
      {
        next: "2024-08-21T21:00:40.818Z",
        zone: "Tefkari",
        type: 1,
        weekday: 3,
        time: "2100",
        particle: "Quantum",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Zhian",
          "Innlasn",
          "Vantar"
        ]
      },
      {
        next: "2024-08-25T22:00:40.818Z",
        zone: "Temeri",
        type: 1,
        weekday: 7,
        time: "2200",
        particle: "Phantom",
        rss: [
          "iso2",
          "dilithium"
        ],
        paths: [
          "Adia",
          "Perim",
          "Ezla"
        ]
      },
      {
        next: "2024-08-22T23:00:40.818Z",
        zone: "Tezera",
        type: 2,
        weekday: 4,
        time: "2300",
        particle: "Phantom",
        rss: [
          "iso3",
          "crystal3"
        ],
        paths: [
          "Adia",
          "Vemira",
          "Tigan",
          "Tholus"
        ]
      },
      {
        next: "2024-08-21T19:00:40.818Z",
        zone: "Thaylen",
        type: 1,
        weekday: 3,
        time: "1900",
        particle: "Quantum",
        rss: [
          "iso2",
          "dilithium"
        ],
        paths: [
          "Burran",
          "Roshar",
          "Comst"
        ]
      },
      {
        next: "2024-08-25T00:00:40.819Z",
        zone: "Tholus",
        type: 3,
        weekday: 7,
        time: "0000",
        particle: "Phantom",
        rss: [
          "crystal3",
          "crystal4"
        ],
        paths: [
          "Tezera",
          "Abilakk",
          "Anzat"
        ]
      },
      {
        next: "2024-08-22T00:00:40.819Z",
        zone: "Thosz",
        type: 1,
        weekday: 4,
        time: "0000",
        particle: "Phantom",
        rss: [
          "iso2",
          "parsteel"
        ],
        paths: [
          "Aylus",
          "Abilakk",
          "Eldur"
        ]
      },
      {
        next: "2024-08-24T01:00:40.819Z",
        zone: "Tigan",
        type: 1,
        weekday: 6,
        time: "0100",
        particle: "Surax",
        rss: [
          "iso2",
          "dilithium"
        ],
        paths: [
          "Tezera",
          "Vemira",
          "Triss"
        ]
      },
      {
        next: "2024-08-22T20:00:40.819Z",
        zone: "Triss",
        type: 2,
        weekday: 4,
        time: "2000",
        particle: "Surax",
        rss: [
          "iso3",
          "gas3"
        ],
        paths: [
          "Zhian",
          "Lenara",
          "Tigan",
          "Mak'ala"
        ]
      },
      {
        next: "2024-08-22T17:00:40.819Z",
        zone: "Vantar",
        type: 2,
        weekday: 4,
        time: "1700",
        particle: "Quantum",
        rss: [
          "iso3",
          "gas3"
        ],
        paths: [
          "Innlasn",
          "Nyrheimur",
          "Tefkari",
          "Klefaski"
        ]
      },
      {
        next: "2024-08-25T19:00:40.819Z",
        zone: "Vemira",
        type: 1,
        weekday: 7,
        time: "1900",
        particle: "Surax",
        rss: [
          "iso1",
          "iso2"
        ],
        paths: [
          "Tigan",
          "Tezera",
          "Hoobishan"
        ]
      },
      {
        next: "2024-08-21T23:00:40.819Z",
        zone: "Zamaro",
        type: 1,
        weekday: 3,
        time: "2300",
        particle: "Phantom",
        rss: [
          "iso2",
          "dilithium"
        ],
        paths: [
          "Bimasa",
          "Ber'Tho",
          "Saldeti"
        ]
      },
      {
        next: "2024-08-19T18:00:40.819Z",
        zone: "Zhian",
        type: 2,
        weekday: 1,
        time: "1800",
        particle: "Surax",
        rss: [
          "iso3",
          "gas3"
        ],
        paths: [
          "Tefkari",
          "Helvi",
          "Triss",
          "Mak'ala"
        ]
      }
    ]).pipe(map(v => v.map((vin: any) => parseDate(vin, 'next'))))
  }

  saveNewEvent(guild: string, data: any): Observable<SaveResponse> {
    return of({status :true, error: ''});
  }

  updateEvent(id: string, data: any): Observable<SaveResponse> {
    return of({status :true, error: ''});
  }

  deleteEvent(id: string): Observable<SaveResponse> {
    return of({status :true, error: ''});
  }

  getPlayerInfoVersions(): Observable<any> {
    return of(null);
  }

  getPlayerInfoTags(): Observable<any> {
    return of(null);
  }

  getPlayerList(query: any): Observable<any[]> {
    return of([]);
  }

}
