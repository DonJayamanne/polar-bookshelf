# Overview

Sharing Design in Polar

# Datastructure

Update the DocMeta to include a new sharing section that's a sibling to DocInfo 
(DocSharing?)

```

{
    /**
     * Stores the high level sharing permissions for the document including 
     * where we received and who has been given access.
     */
    sharing: {
        
        // FIXME: this is now a doc_peer table.
        
        /**
         * Contains a list of users that are also sharing the same document that
         * we're collaborating with (all the peers in the group).
         */
        peers: [
            {
            
                /**
                  * True when this is the original user who granted us access
                  * to the document.
                  *
                origin: true,

                /**
                 * The time we discovered this user.
                 */                
                discovered: "2008-09-15T15:53:00+05:00",
                
                /**
                 * The owner of this document in our 'contact' table.     
                 */
                contact_id: '',

                /**
                 * The user ID of the owner, denormalized from the contact ID.
                 */
                user_id: '',
            
                // The `doc_id` is needed in the source so that we can use
                // FileRef when the user calls BackendFileRefs.toBackendFileRefs
                // I can compute/add the required metadata that needs to be
                // attached to the FileRef to denote whether they are the owner
                // or not and who the owner is and how we build the URL
                // properly.
                // 
                // We then lookup the data on the backend permissions system so
                // that we verify that the user actually DOES have access to the
                // file.

                doc_id: '0x000'
                
                /**
                 * The last version of this document we've seen.  This is used 
                 * to determine if we need to update in the UI.
                 */
                uuid: string,
                
            }            
        ]
                
    },
    
}
```

# Tables

## doc_peer

Grants permission for a user to access a document.  This is basically a 'grant'
datastructure which gives the user the pointer to the doc_id to read.

|| id || The DocID of the document ||
|| uid || FirebaseUIDStr || The owner of this record ||
|| contact_id || The contact ID in our contact database || From this user. We do NOT expose their uid and keep this private.  We use the email addr see ```from_resolution``` footnote ||
|| token || string || The token used by this user for accessing the resource ||
|| reciprocal || boolean || True if this is a reciprocal grant so that the original user can get access to the doc meta back ||

## doc_peer_pending

Used to grant docs to other people so that they can then store their own 
uid there. For now we use the users primary email but we could query for all
of them in the future as long as the user authenticates them properly.


```text
type UserIdentity {
    email?: EmailSTR,
    contact_id?: string    
}
```

### schema

|| id || specific IUD for this pending invitation ||
|| to || EmailStr || An email address for the user ||
|| token || string || The token used by this user for accessing the resource ||
|| message || string || A message given to the user in the original grant so that it can show up in the UI for them to understand why this document was given to them ||
|| reciprocal || boolean || True if this is a reciprocal grant so that the original user can get access to the doc meta back ||

### Footnotes

from_resolution:  We can't give out the uid due to security issues but what we
do do is provide access to the email. This is then re-written to import the 
email and contact info ito the users local contact database which is 
de-normalized from the main datastore. 

## doc_permission

Contains the permissions set for the user for this document in their repo.

By default the document is private (no permissions).

### schema

|| id || The DocID of the document ||
|| uid || The users uid that owns the id (DocID) ||
|| fingerprint || The fingerprint of the document in the doc repo ||
|| recipients || An array of encoded recipients who have access to the document || 
|| recipientTokens || A map of recipients and their tokens used ||  

### example:

```text
{
    id: 10101,
    uid: "12345",
    fingerprint: "12345",
    // who has been given access to this document.
    recipients: [
        'mailto:alice@example.com',
        'mailto:bob@example.com',
        'group:0001',
        'group:0002',
        'token:0003'
    ]
    
}
```

## message

Stores a message for an 'inbox' that is displayed to a user. The messages are 
typed do we can have user to user messages but also features like a user added 
you as a contact or a user shared a document with you.

The user will have a popup in the top right with messages and they can either
accept or deny documents that were added and also 'open' them.

We use this for two main reasons:

- to notify you when someone has added you as a friend

- to notify you when you have a new document you can add to your repo

### schema

||type|| shared_doc | new_friend || The type of the message for the user||

### messages types

- shared_doc: a new document has been shared with you

#### shared_doc

## contact

A contact that you've interacted with in the past either as a friends or a handle. 

Used to keep track of everyone you've collaborated with so auto-complete can work.

### fields

|| id || A unique contact ID for this user and they are sharing some selected information about their profile ||
|| rel || ReadonlyArray<RelType> || The list or relationships for this contact.
|| name || string || Their name ||
|| image || Image || The image URL to their profile with src, width, and height ||    
 
### type RelType = 'friend' | 'shared';

- friend: We've added this user as a friend

- shared: We've shared a document with this user.

# Issues

## When you share a document from someone can they later revoke their permissions to access the document?

Yes.  We should allow this though it's a rare use case.  We might also want to 
preserve the original user who shared it with us so that we can warn the user 
that they are about to block the original author.   

However, you're essentially  GIVING the document to someone thi sway.

# Firebase Rules / Permissions.
    
We store the permission and sharing structure in a separate doc. This way the
actual sharing settings aren't shared across and given to people with their
documents.

These are stored in ```doc_permission``` and ```doc_peer``` tables.

A new DocMeta rule should be:

```

  function hasRecipientByEmail() {
    return resource.data.recipients.includes('mailto:' + request.user.email);
  }

  allow read: if hasRecipientByEmail();
   
```                

https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents

```text

    match /doc_meta/{document=**} {
            
        // FIXME: this won't work right now and isn't very elegant.
        //
        // 1. we're getting an error if the document doesn't exist
        //
        // 2. we can do an exists here but I don't know how I'm charged for this
        //
        // 3. these are slow as hell right now.. taking 2-3 seconds per request.

        /**
          * Get the doc permissions or an empty version with an empty recipients.
          */
        function hasDocPermission() {
            return exists(/databases/$(database)/documents/doc_permission/$(resource.data.id));        
        }

        /**
          * Get the doc permissions or an empty version with an empty recipients.
          */
        function getDocPermission() {
            return get(/databases/$(database)/documents/doc_permission/$(resource.data.id));        
        }

        
        function getDocPermissionRecipients() {
            return getDocPermission().data.recipients;  
        }
                            
        allow read: if request.auth != null && request.auth.uid == resource.data.uid;
        
        // TODO migrate to custom claims for all the users email addresses                     
        allow read: if hasDocPermission() && getDocPermissionRecipients().hasAny([request.auth.token.email]);

        allow write: if request.auth != null && (resource == null || request.auth.uid == resource.data.uid);

    }
 
    match /doc_peer/{document=**} {
        allow read, write: if resource.data.uid == request.auth.uid;
    }
    
    match /doc_peer_pending/{document=**} {
        
        // the user should only be able to read their OWN pending documents.
        allow read, delete: if resource.data.to == request.auth.token.email;

        // TODO: update this to use ALL of the users emails via custom claims  

        allow write;
        
    }

    match /doc_permission/{document=**} {
        
        // the user should only be able to read their OWN permissions.
        //
        // only update if you're the owner which I need to do when accepting 
        // an invitation to a document
        //
        // only delete it if we're the user otherwise you could delete someone's
        // peers without their permissions.       
        allow read, update, delete: if resource.data.uid == request.auth.uid;

        // only done during the initial grand period and anyone should be able 
        // to do this so that we can give the user access to our document.
        allow create;            
    }
  

```


## doc_peer

Only the USER should be able to read their doc_peer but anyone can write to it.

This is needed because we need to 'give' access to another person by writing 
the new record.

## doc_permission

Only the primary user has access to read/write this record.  This controls all
their permissions

# Building Fetch URLs

As part of the doc permission system we need a way to grant+revoke and a token 
needs to be used.  Otherwise, once the user has the token, they will have
permissions in perpetuity. 

# New users without accounts

One issue is how do we give documents to users who have not yet entered the
system.

We're going to solve this via doc_peer_pending which is only resolved on initial
account creation.

On initial account creation we lookup the doc_peer_pending table and migrate
these into doc_peer with the correct 'to' address.

We then delete the originals.

We are going to have to mark the 'account' so that we can know that we've 
migrated the records properly.

This will have to be a boolean that we flag at the end.

- TODO: we might need to do this on the backend so that the permissions works.

# Custom Claims in the Future

In the future we might be able to use custom claims to speed up authentication.  

With 1000 bytes this would allow about 125 groups MAX but in practice it's more 
like 100 since I probably have to encode them.  I might want to just store these
encoded in an efficient string.

This would speed up auth but it's a bit more complicated right now. 

# Transitive Discovery 

This idea is generally that ANYONE that is sharing a document has access to 
everyone else.

I think we should consider making this a feature later but it would require 
changes on the client.

This is done by sharing the value of the doc_id AND updating the doc_permission.

The USER has to change the doc_permissions setting.  Just because someone has
the value of a id doesn't mean they can actually read the document.

The idea here is that we implement this in the client such that we look at 
everyone we've given access to, find their doc_peer settings, then automatically
change OURS adding them and giving them permission.

We would need to implement this on the client and make it a premium feature to 
disable. 

- Initially we have NO limits on who can be added.  We add everyone in the 
  chain this way people can discover one another indefinitely.  The one issue 
  here though is latency.  Users are going to pop in all at once.      

# Message Delivery

- email and using mandrill with mailchimp so that when someone is added they 
  get a transactional email from the user.

- TODO we need to settle on a system for transactional email.  Sendgrid is just
  too pricey.

# Solution to group membership problems:

We cna use hasAny method in list which will resolve this nicely as long as the
strings match up properly

https://firebase.google.com/docs/reference/rules/rules.List
https://firebase.google.com/docs/reference/rules/rules.Map


## Groups 

In the future we're going to need to have a separate group 

## Rules behavior and caching. 

https://firebase.google.com/docs/rules/rules-behavior

"Some document access calls may be cached, and cached calls do not count towards the limits."

# Implementation Strategy

- the first big milestone I have to implement is changing the permissions with 
  one user and then fetching again with another user to make sure they can 
  access all the resources properly.

    https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents

- the current 'permissions' system of 'private' or 'public' with the DocMeta 
  won't really work with the new system so we have to upgrade the permissions 
  there to match this.  It was never deployed though so we're good.  I think we 
  just have to update the firebase permissions to match this system but I need
  to figure out how to write it and test it. 



1.  Write the data structure to firebase via test/command line so that we can verify that the data is written properly
2.  Write the hook on the backend to pass the request through with the proper lookup mechanism.
3.  Make sure the sharing data structure is serialize properly.  


# Topic / Group strategy

For now do not implement topics. It's going to be far more complicated.  We just
need to get basic sharing to work.  

The owner of the group controls the membership and then we do a get() on the 
group membership for permissions within firebase security rules.


# Data flow of sharing process

 - Alice wants to share a doc  and clicks 'share' in the sidebar
 
 - Alice gives access to either:

     - ```share_target_team```: a team (via her list of contacts) that she has already
       joined.
     
     - ```share_target_existing_email```: to an existing user contact (that she's
       added previously)
     
     - ```share_target_new_email```: or via a (new) contact (via email address) 

 - If ```share_target_new_email```
     - New email (Bob) goes into her 'contacts' as a table entry for
       auto-completion in the future.
    
     - An email is sent to Bob letting him know what a document has been shared 
       with him.

     - Alice will update ```doc_permission``` with a record pointing to Bob 
       to allow him to read the document.
        
     - A ```doc_peer``` record is written to Bob and from Alice giving Bob access to
       the DocID created by Alice.  This DocID can then be used by Bob to access all
       the resources of Alice's shared document (including image files).
           
     - Bob logs into Polar and sees a new document shared with him via the
       notifications bar at the top.  We can find this by looking at the 
       ```doc_peer``` table to see which records have not been ```accepted```.
       
     - Bob accepts this document by clicking the 'add' button in the
       notifications dropdown.
       
     - We then migrate the ```doc_peer``` ```from``` column to use a contact_id
       and migrate this user into a contact. 
   
     - Once added Bob has a sharing section with a peer reference to Alice's doc.
       Has added Alice as a contact, and a reciprocal 'grant' is given to Alice 
       directly via the same mechanism of the ```doc_peer``` system only this 
       time Alice automatically accepts it since it's ```reciprocal```.  Note
       that we have to validate this reciprocity to make sure it's legitimate.
       
     - At this point both Bob and Alice are sharing access to each others's
       documents.

  - If ```share_target_team```: (this part is tentative)
     - An email is sent to everyone in the 'team' letting them know that Alice
       has shared a document with them.
       
     - Alice updates doc_peer granting access to anyone from that group access
       to her document record.        
  
     - Alice will update ```doc_permission``` with a record pointing to the team to
       allow him to read the document.
       
     - 

 
# Dynamic and realtime updates to the DocMeta / viewer.

We've never had the ability to update the DocMeta and reload the viewer so we 
have to add support for that.

This will involved:

- Adding a snapshot listener to wait for updates for any of the peer documents
  and the master document.
  
- The datastore will need to support this.

- When the update is detected the TARGET metadata will be merged with the new metadata

- During the update we will disable persistence so that any updates we make are 
  NOT written back out to disk. 
   
- We might have to have one MASTER document for persisting writes and one for 
  showing in the UI.

# Top Friend Recommendation

We need to have TWO top friend recommendation systems.

The first is global. This is our fallback. This will be the top users in the 
system. We use this to bootstrap and then we start migrating the user to their 
own personalized system.

Next, we just to a basic collaborative filtering system where we take the 
users friends, then their friends, and rank them by counts on the backend with 
a cloud function.

We cache this and updated it if it's stale on login when the user logs in and
it hasn't been updated in 24 hours. This should allow us to reduce our total 
computational complexity for this component.

The TOP recommender algorithm would probably need to use google cloud big query 
or something or maybe pagerank (ideally) so that we have a robust top user 
ranking system.       

This would only run on top documents.

I think I can get this query down to less than 5 seconds if done properly.

https://docs.google.com/spreadsheets/d/1eYnlXwNVGiDHo07pNAVU_Fjc9UwHrdYyMbYhhK8L8SM/edit?usp=sharing

This would only be about 100 requests and we can use both the global and local 
data to compute this.  For example we can take the top ranking users local to 
each user OR we can compute their local rank if there's overlap.

The math for this worked out (for a basic algorithm) to be about $360 per month
on firebase if we only focused this on the local graph and only read the friends
of the user to 1 degree.  This wouldn't be a massive amount of data and we could
recompute it every hour.

The only way we enable the secondary / user-specific algorithm is if there is
enough overlap for specialized recommendations.  We would need to have 5-10 head
nodes with > 10 ranking.  Once these are ranked just fetch their metadata
directly.



# Recommended reading

We would use a similar algorithm to this:  

# Future 

- design the fan out system for the 'river of annotations' view for each  
  user. I might have to have a cloud function do this and to the fanout directly 
  and maybe via batches.  This might not scale too... if it's via a hook it might 
  take a while though.
    
    - This is also needed for the group system so I can share this code.  Just
      design the system, don't build it now.  Designing it means that I at least
      think through all the problems so I don't back myself into a corner.
      
    - this won't be built out just yet...    
               
# Top Friend Recommendation

We need to have TWO top friend recommendation systems.

The first is global. This is our fallback. This will be the top users in the 
system. We use this to bootstrap and then we start migrating the user to their 
own personalized system.

Next, we just to a basic collaborative filtering system where we take the 
users friends, then their friends, and rank them by counts on the backend with 
a cloud function.

We cache this and updated it if it's stale on login when the user logs in and
it hasn't been updated in 24 hours. This should allow us to reduce our total 
computational complexity for this component.

The TOP recommender algorithm would probably need to use google cloud big query 
or something or maybe pagerank (ideally) so that we have a robust top user 
ranking system.       

This would only run on top documents.

I think I can get this query down to less than 5 seconds if done properly.

https://docs.google.com/spreadsheets/d/1eYnlXwNVGiDHo07pNAVU_Fjc9UwHrdYyMbYhhK8L8SM/edit?usp=sharing

This would only be about 100 requests and we can use both the global and local 
data to compute this.  For example we can take the top ranking users local to 
each user OR we can compute their local rank if there's overlap.

The math for this worked out (for a basic algorithm) to be about $360 per month
on firebase if we only focused this on the local graph and only read the friends
of the user to 1 degree.  This wouldn't be a massive amount of data and we could
recompute it every hour.

The only way we enable the secondary / user-specific algorithm is if there is
enough overlap for specialized recommendations.  We would need to have 5-10 head
nodes with > 10 ranking.  Once these are ranked just fetch their metadata
directly.

# Multiple Email Addresses

Allow users to add multiple email addresses to their account by just adding the
email, sending a challenge nonce, then clicking a link to verify it properly.
 
We can just use an email_challenge feature and then associate all these
emails with your account via a set.     


# Token sharing "anyone with the URL"

- we expose the raw doc ID in the URL?
    - are there any downsides to this?  I don't think leaking it is a problem
    
    - JUST create a sharing URL and then that URL adds it to the users doc repo 
      by doc ID and we have a special 'token' in there or something or 'linked'  
      
    - 'public-via-link:' is the sharing mechanism there needs to be an associated 
      permission with th is.  The link itself adds the doc to the users repo.

    - TODO: the problem with this strategy is that there's no way to revoke
      access once the URL is given out.

    - TODO: 
        - I can do a get() on the user_token for that user and the doc token 
        to see if that user has access to that token but the gets are going to 
        more expensive.  However, we can move on from this in the future
        and provide a smarter mechanism later. 

    - I think this is the only real way we can do this honestly.

## TODO

- TODO: how do I do token sharing ??? it will work for everything BUT the 
  firebase doc... and I am not sure how to support it...
    - one thing is to expose the key directly as the token? Then I remove the 
      token as part of the permissions in the future ?   

- We need a reverse chronological timeline for groups and users. I think this
should generally be the same structure and just store a ordered list of
annotations which can then be viewed in the UI.  We're going to go after users
first and view their stream of annotations.

- backend components working first
    
    - get the 'fetch' API call to work so I can fetch resources
    - revoke permissions
    - tokens to work and the sharing URL to work
    - 