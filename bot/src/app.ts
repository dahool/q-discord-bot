import { AddRoleCommand } from "./commands/addrole.command";
import { AllianceCommand } from "./commands/alliance.command";
import { ConfigCommand } from "./commands/config.command";
import { PublishCommand } from "./commands/publish.command";
import { ReadyCommand } from "./commands/ready.command";
import { TerritoryEventAdd, TerritoryEventDelete, TerritoryEventList, TerritoyInfoCommand } from "./commands/territory";


import { AppModules } from "./common/modules";
import { ChannelCreateListener, ChannelDeleteListener, ChannelUpdateListener } from "./listeners/channel-update.listeners";
import { NewTheadFollowerListener, NewTheadPingerListener } from "./listeners/newthread.listener";
import { GuildClientUpdateListener, ReadyListener } from "./listeners/ready-sync.listener";

import { RoleCreateListener, RoleDeleteListener, RoleUpdateListener } from "./listeners/role-update.listeners";
import { OnEventCreateListener, OnEventDeleteListener, OnEventUpdateListener } from "./listeners/scheduledevent.listener";

export const application = new AppModules();

/* commands */
application.register(ReadyCommand);
application.register(PublishCommand);
application.register(TerritoyInfoCommand);
application.register(TerritoryEventAdd);
application.register(TerritoryEventList);
application.register(TerritoryEventDelete);
application.register(AllianceCommand);
application.register(ConfigCommand);
application.register(AddRoleCommand);

/* events */
application.register(ReadyListener);
application.register(OnEventCreateListener);
application.register(OnEventDeleteListener);
application.register(OnEventUpdateListener);

application.register(NewTheadFollowerListener);
application.register(NewTheadPingerListener);

application.register(ChannelCreateListener);
application.register(ChannelUpdateListener);
application.register(ChannelDeleteListener);

application.register(RoleCreateListener);
application.register(RoleUpdateListener);
application.register(RoleDeleteListener);

application.register(GuildClientUpdateListener);