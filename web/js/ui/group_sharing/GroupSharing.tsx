import React from 'react';
import {Toaster} from '../toaster/Toaster';
import {Firebase} from '../../firebase/Firebase';
import {Groups} from '../../datastore/sharing/db/Groups';
import {Releaser} from '../../reactor/EventListener';
import {Logger} from '../../logger/Logger';
import {Doc} from '../../metadata/Doc';
import {Preconditions} from '../../Preconditions';
import {
    ContactProfile,
    GroupSharingRecords,
    MemberRecord
} from './GroupSharingRecords';
import {GroupSharingControl, InvitationRequest} from './GroupSharingControl';
import {LoginRequired} from "./LoginRequired";

const log = Logger.create();

/**
 * Allow the user to select from one or more of their contacts.
 */
export class GroupSharing extends React.Component<IProps, IState> {

    protected readonly releaser = new Releaser();

    constructor(props: IProps) {
        super(props);

        this.onConnectivity = this.onConnectivity.bind(this);

        this.state = {
            connectivity: 'unknown',
            contactProfiles: [],
            members: []
        };

    }

    public componentDidMount(): void {

        const errorHandler = (err: Error) => {
            const msg = "Unable to get group notifications: ";
            log.error(msg, err);
            Toaster.error(msg, err.message);
        };


        const contactsHandler = (contactProfiles: ReadonlyArray<ContactProfile>) => {

            if (this.releaser.released) {
                return;
            }

            this.setState({...this.state, contactProfiles});

        };

        const membersHandler = (members: ReadonlyArray<MemberRecord>) => {

            if (this.releaser.released) {
                return;
            }

            this.setState({...this.state, members});

        };

        const doHandle = async () => {

            const user = await Firebase.currentUser();

            if (! user) {
                this.onConnectivity('unauthenticated')
                return;
            }

            this.onConnectivity('authenticated')

            const docMeta = this.props.doc.docMeta;
            const fingerprint = docMeta.docInfo.fingerprint;

            const uid = user!.uid;

            const groupID = Groups.createIDForKey(uid, fingerprint);

            GroupSharingRecords.fetch(groupID,
                                      contacts => contactsHandler(contacts),
                                      members => membersHandler(members),
                                      err => errorHandler(err));

        };

        doHandle().catch(err => errorHandler(err));

    }

    public componentWillUnmount(): void {
        this.releaser.release();
    }

    public render() {

        switch (this.state.connectivity) {

            case "unknown":
                return <div/>;
            case "unauthenticated":
                return <LoginRequired/>;
            case "authenticated":
                return <GroupSharingControl {...this.props} {...this.state}/>;
        }

    }

    private onConnectivity(connectivity: Connectivity) {
        this.setState({...this.state, connectivity});
    }

}

interface IProps {
    readonly doc: Doc;
    readonly onCancel: () => void;
    readonly onDone: (invitation: InvitationRequest) => void;
    readonly onDelete: (member: MemberRecord) => void;
}

interface IState {
    readonly contactProfiles: ReadonlyArray<ContactProfile>;
    readonly members: ReadonlyArray<MemberRecord>;
    readonly connectivity: Connectivity;
}

export type Connectivity = 'unknown' | 'unauthenticated' | 'authenticated';
