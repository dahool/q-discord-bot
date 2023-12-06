import "reflect-metadata";
import { environment } from "./env/environment";
import { GuildMemberModel, Member, closeDatabaseConnection, createDatabaseConnection } from "./repository";

class MemberSet extends Set {

    addAndUpdate(o: Member) {
        for (let i of this) {
          if (this.compareMember(o, i)) {
            this.merge(o, i);
            return false;
          }
        }
        super.add.call(this, o);
        return true;
    };
    
    private compareMember(o: Member, i: Member) {
        return o.memberId == i.memberId && o.guild == i.guild;
    }

    private merge(newItem: Member, current: Member) {
        current.alias = Array.from(new Set([...newItem.alias, ...current.alias]));
    }

}

createDatabaseConnection(environment.database.url!).then(async mongo => {
    
    let modelList = await GuildMemberModel.find().exec();
    let memberSet = new MemberSet();

    let allDeletes = [];
    for (let model of modelList) {
        allDeletes.push(model.deleteOne());
        memberSet.addAndUpdate(model);
    }
    console.log("Total in list %d", modelList.length);
    console.log("Total in Set %d", memberSet.size);
    
    await Promise.all(allDeletes);
    
    let allCreates = [];
    for (let member of memberSet) {
        allCreates.push(GuildMemberModel.create({
            guild: member.guild,
            memberId: member.memberId,
            username: member.username,
            avatar: member.avatar,
            join: member.join,
            lastSeen: member.lastSeen,
            left: member.left,
            alias: member.alias
        }));
    }

    await Promise.all(allCreates);

    closeDatabaseConnection().then(() => {
        process.exit(0);
    })

}).catch(error => {
    console.error(error);
});