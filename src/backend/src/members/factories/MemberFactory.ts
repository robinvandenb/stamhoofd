import { Member } from '../models/Member';
import { Factory } from '@stamhoofd/backend/src/database/classes/Factory';
import { Organization } from '@stamhoofd/backend/src/organizations/models/Organization';

class Options {
    organization: Organization
}

export class MemberFactory extends Factory<Options, Member> {
    async create(): Promise<Member> {
        const member = new Member().setRelation(Member.organization, this.options.organization)
        member.encrypted = "This is encrypted data"

        await member.save()
        return member
    }
}