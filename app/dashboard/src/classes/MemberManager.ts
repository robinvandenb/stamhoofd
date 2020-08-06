

import { ArrayDecoder, Decoder, ObjectData, VersionBoxDecoder, VersionBox } from '@simonbackx/simple-encoding'
import { Sodium } from '@stamhoofd/crypto'
import { Keychain, SessionManager } from '@stamhoofd/networking'
import { MemberWithRegistrations, EncryptedMember, EncryptedMemberWithRegistrations, MemberDetails, Version, Member } from '@stamhoofd/structures'
import { OrganizationManager } from './OrganizationManager';

/**
 * Controls the fetching and decrypting of members
 */
export class MemberManagerStatic {
    async decryptMembersWithoutRegistrations(data: EncryptedMember[]) {
        // Save keychain items
        const members: Member[] = []
        const keychainItem = Keychain.getItem(OrganizationManager.organization.publicKey)

        if (!keychainItem) {
            throw new Error("Missing organization keychain")
        }

        const session = SessionManager.currentSession!
        const keyPair = await session.decryptKeychainItem(keychainItem)

        for (const member of data) {

            let decryptedDetails: MemberDetails | undefined

            if (!member.encryptedForOrganization) {
                console.warn("encryptedForOrganization not set for member " + member.id)
            } else {
                try {
                    const json = await Sodium.unsealMessage(member.encryptedForOrganization, keyPair.publicKey, keyPair.privateKey)
                    const data = new ObjectData(JSON.parse(json), { version: Version }); // version doesn't matter here
                    decryptedDetails = data.decode(new VersionBoxDecoder(MemberDetails as Decoder<MemberDetails>)).data
                } catch (e) {
                    console.error(e)
                    console.error("Failed to read member data for " + member.id)
                }
            }

            const decryptedMember = Member.create({
                id: member.id,
                details: decryptedDetails,
                publicKey: member.publicKey,
            })

            members.push(decryptedMember)
        }

        return members;
    }

    async decryptMembers(data: EncryptedMemberWithRegistrations[]) {
        // Save keychain items
        const members: MemberWithRegistrations[] = []
        const groups = OrganizationManager.organization.groups
        const keychainItem = Keychain.getItem(OrganizationManager.organization.publicKey)

        if (!keychainItem) {
            throw new Error("Missing organization keychain")
        }

        const session = SessionManager.currentSession!
        const keyPair = await session.decryptKeychainItem(keychainItem)

        for (const member of data) {

            let decryptedDetails: MemberDetails | undefined

            if (!member.encryptedForOrganization) {
                console.warn("encryptedForOrganization not set for member " + member.id)
            } else {
                try {
                    const json = await Sodium.unsealMessage(member.encryptedForOrganization, keyPair.publicKey, keyPair.privateKey)
                    const data = new ObjectData(JSON.parse(json), { version: Version }); // version doesn't matter here
                    decryptedDetails = data.decode(new VersionBoxDecoder(MemberDetails as Decoder<MemberDetails>)).data
                } catch (e) {
                    console.error(e)
                    console.error("Failed to read member data for " + member.id)
                }
            }

            const decryptedMember = MemberWithRegistrations.create({
                id: member.id,
                details: decryptedDetails,
                publicKey: member.publicKey,
                registrations: member.registrations
            })

            decryptedMember.fillGroups(groups)
            members.push(decryptedMember)
        }

        return members;
    }

    async loadMembers(groupId: string | null = null, waitingList = false) {
        const session = SessionManager.currentSession!
        const response = await session.authenticatedServer.request({
            method: "GET",
            path: "/organization/group/" + groupId + "/members",
            decoder: new ArrayDecoder(EncryptedMemberWithRegistrations as Decoder<EncryptedMemberWithRegistrations>),
            query: waitingList ? { waitingList: true } : {}
        })
        return await this.decryptMembers(response.data)
    }
}

export const MemberManager = new MemberManagerStatic()