import * as React from 'react';
import {Tags} from '../../js/tags/Tags';
import {AccountUpgradeBarView} from "../../js/ui/account_upgrade/AccountUpgradeBarView";
import {SimpleTabs} from "../../js/ui/simple_tab/SimpleTabs";
import {SimpleTab} from "../../js/ui/simple_tab/SimpleTab";
import {Feedback} from "../../js/ui/feedback/Feedback";
import {NULL_FUNCTION} from "../../js/util/Functions";
import {UpgradeRequired} from "../../js/ui/account_upgrade/UpgradeRequired";

const styles = {
    swatch: {
        width: '30px',
        height: '30px',
        float: 'left',
        borderRadius: '4px',
        margin: '0 6px 6px 0',
    }
};

const Folders = () => {
    return <div style={{backgroundColor: 'red', overflow: 'auto'}}>
        these are the folders
    </div>;
};

const Preview = () => {
    return <div style={{backgroundColor: 'orange', overflow: 'auto'}}>
        This is the preview
    </div>;
};


const Main = () => {
    return <div style={{backgroundColor: 'blue'}}>this is the right</div>;
};

class App<P> extends React.Component<{}, IAppState> {

    constructor(props: P, context: any) {
        super(props, context);

    }

    public render() {


        //
        // const root: TNode<TagNode> = {
        //     id: 0,
        //     name: 'CompSci',
        //     children: [
        //         {
        //             id: 1,
        //             name: 'Linux',
        //             children: [],
        //             value: {
        //                 tag: "/CompSci/Linux"
        //             }
        //         },
        //         {
        //             id: 2,
        //             name: 'Google',
        //             children: [
        //                 {
        //                     id: 3,
        //                     name: 'Mountain View',
        //                     children: [],
        //                     value: {
        //                         tag: "/CompSci/Google/Mountain View"
        //                     }
        //                 },
        //                 {
        //                     id: 4,
        //                     name: 'San Francisco',
        //                     children: [],
        //                     value: {
        //                         tag: "/CompSci/Google/San Francisco"
        //                     }
        //                 },
        //             ],
        //             value: {
        //                 tag: "/CompSci/Google"
        //             }
        //
        //         }
        //
        //     ],
        //     value: {
        //         tag: "/CompSci"
        //     }
        // };

        const tags = [
            '/CompSci/Google',
            '/CompSci/Linux',
            '/CompSci/Microsoft',
            '/CompSci/Programming Languages/C++',
            '/CompSci/Programming Languages/Java',
            '/History/WWII',
            '/History/United States/WWII',
        ].map(current => Tags.create(current))
         .map(current => {
             const count = Math.floor(Math.random() * 100);
             return {...current, count};
         });

        // // const root: TNode<Tag> = TagNodes.create(...tags);
        // Dialogs.prompt({
        //                    title: "Enter the name of a new folder:",
        //                    validator: () => {
        //                        return {message: "it failed dude"};
        //                    },
        //                    onCancel: NULL_FUNCTION,
        //                    onDone: NULL_FUNCTION
        //
        //                });
        return (

            <div style={{margin: '5px'}}>

                {/*<MockFolderTree/>*/}

                {/*<AccountUpgradeBarView plan='free' accountUsage={{storageInBytes: 5000000000}}/>*/}

                <UpgradeRequired planRequired='gold'/>

                {/*<Feedback category='net-promoter-score'*/}
                {/*          title='How likely are you to recommend Polar?'*/}
                {/*          from="Not likely"*/}
                {/*          to="Very likely"*/}
                {/*          onRated={NULL_FUNCTION}/>*/}

                {/*<SimpleTabs>*/}

                {/*    <SimpleTab href="#" text="Document Repository" active={true}>*/}

                {/*    </SimpleTab>*/}

                {/*    <SimpleTab href="#" text="Groups">*/}

                {/*    </SimpleTab>*/}

                {/*</SimpleTabs>*/}

                {/*<TreeView root={root}*/}
                {/*          />*/}

                {/*<Dock side="left"*/}
                {/*      left={<Folders/>}*/}
                {/*      right={<Dock side="left"*/}
                {/*                   left={<Preview/>}*/}
                {/*                   right={<Main/>}/>}/>*/}


            </div>

        );
    }


}

export default App;

interface IAppState {

}


