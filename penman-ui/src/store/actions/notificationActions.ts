import * as signalR from '@microsoft/signalr';
import { useSelector, useDispatch } from 'react-redux';
import { apiConstants, notificationConstants, relationshipConstants,
    bookConstants, chapterConstants, personificationConstants, promptConstants, shortConstants, tagConstants } from '../../constants';
import { IRootState, IAuthenticatedUser,
    IClientBook, Book,
    IClientChapter, Chapter,
    IClientPersonification, Personification,
    IClientPrompt, Prompt,
    IClientRelationship, Relationship,
    IClientShort, Short,
    IClientTag, Tag } from '../types';

export const subscribePenmanHub = (user: IAuthenticatedUser, accessTokenFactory: () => string, nginxHint?: string, subscriptions?: string[]) => {
    const dispatch = useDispatch();
    const timestamp = Date.now();
    const url = nginxHint ? `${apiConstants.penmanHub}/${nginxHint}` : apiConstants.penmanHub;
    const penmanHubConnection = new signalR.HubConnectionBuilder()
        .withUrl(url, { accessTokenFactory, transport: signalR.HttpTransportType.WebSockets })
        .withAutomaticReconnect()
        .build();

    /**
     * BOOK NOTIFICATIONS
     */
    penmanHubConnection.on(notificationConstants.NOTIFICATION_BOOK_CREATED, (bookResponseDto: IClientBook) => {
        const timestamp = Date.now();
        const book = useSelector((state: IRootState) => state.book.books[bookResponseDto.bookId] ?? state.book.uuidLookup[bookResponseDto.clientId] ?? new Book(bookResponseDto));
        if (book instanceof Book) book.onApiProcessed(bookResponseDto);
        // select the book or create a new instance
        // MERGE the current value and the new value here AND in the active item component
        // for now just forward the item and assume no conflict
        dispatch({ type: bookConstants.READ_BOOK_SUCCESS, payload: book, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_BOOK_UPDATED, (bookResponseDto: IClientBook) => {
        const timestamp = Date.now();
        const book = useSelector((state: IRootState) => state.book.books[bookResponseDto.bookId] ?? state.book.uuidLookup[bookResponseDto.clientId] ?? new Book(bookResponseDto));
        if (book instanceof Book) book.onApiProcessed(bookResponseDto);
        dispatch({ type: bookConstants.READ_BOOK_SUCCESS, payload: book, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_BOOK_UPDATED, (bookResponseDto: IClientBook) => {
        const timestamp = Date.now();
        const book = useSelector((state: IRootState) => state.book.books[bookResponseDto.bookId] ?? state.book.uuidLookup[bookResponseDto.clientId] ?? new Book(bookResponseDto));
        if (book instanceof Book) book.onApiProcessed(bookResponseDto);
        dispatch({ type: bookConstants.DELETE_BOOK_SUCCESS, payload: book, timestamp, suppressTimeoutAlert: false });
    });

    /**
     * CHAPTER NOTIFICATIONS
     */
    penmanHubConnection.on(notificationConstants.NOTIFICATION_CHAPTER_CREATED, (chapterResponseDto: IClientChapter) => {
        const timestamp = Date.now();
        const chapter = useSelector((state: IRootState) => state.chapter.chapters[chapterResponseDto.chapterId] ?? state.chapter.uuidLookup[chapterResponseDto.clientId] ?? new Chapter(chapterResponseDto));
        if (chapter instanceof Chapter) chapter.onApiProcessed(chapterResponseDto);
        dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_CHAPTER_UPDATED, (chapterResponseDto: IClientChapter) => {
        const timestamp = Date.now();
        const chapter = useSelector((state: IRootState) => state.chapter.chapters[chapterResponseDto.chapterId] ?? state.chapter.uuidLookup[chapterResponseDto.clientId] ?? new Chapter(chapterResponseDto));
        if (chapter instanceof Chapter) chapter.onApiProcessed(chapterResponseDto);
        dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_CHAPTER_UPDATED, (chapterResponseDto: IClientChapter) => {
        const timestamp = Date.now();
        const chapter = useSelector((state: IRootState) => state.chapter.chapters[chapterResponseDto.chapterId] ?? state.chapter.uuidLookup[chapterResponseDto.clientId] ?? new Chapter(chapterResponseDto));
        if (chapter instanceof Chapter) chapter.onApiProcessed(chapterResponseDto);
        dispatch({ type: chapterConstants, payload: chapter, timestamp, suppressTimeoutAlert: false });
    });

    /**
     * PERSONIFICATION NOTIFICATIONS
     */
    penmanHubConnection.on(notificationConstants.NOTIFICATION_PERSONIFICATION_CREATED, (personificationResponseDto: IClientPersonification) => {
        const timestamp = Date.now();
        const personification = useSelector((state: IRootState) => state.personification.personifications[personificationResponseDto.personificationId] ?? state.personification.uuidLookup[personificationResponseDto.clientId] ?? new Personification(personificationResponseDto));
        if (personification instanceof Personification) personification.onApiProcessed(personificationResponseDto);
        dispatch({ type: personificationConstants.READ_PERSONIFICATION_SUCCESS, payload: personification, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_PERSONIFICATION_UPDATED, (personificationResponseDto: IClientPersonification) => {
        const timestamp = Date.now();
        const personification = useSelector((state: IRootState) => state.personification.personifications[personificationResponseDto.personificationId] ?? state.personification.uuidLookup[personificationResponseDto.clientId] ?? new Personification(personificationResponseDto));
        if (personification instanceof Personification) personification.onApiProcessed(personificationResponseDto);
        dispatch({ type: personificationConstants.READ_PERSONIFICATION_SUCCESS, payload: personification, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_PERSONIFICATION_UPDATED, (personificationResponseDto: IClientPersonification) => {
        const timestamp = Date.now();
        const personification = useSelector((state: IRootState) => state.personification.personifications[personificationResponseDto.personificationId] ?? state.personification.uuidLookup[personificationResponseDto.clientId] ?? new Personification(personificationResponseDto));
        if (personification instanceof Personification) personification.onApiProcessed(personificationResponseDto);
        dispatch({ type: personificationConstants, payload: personification, timestamp, suppressTimeoutAlert: false });
    });

    /**
     * PROMPT NOTIFICATIONS
     */
    penmanHubConnection.on(notificationConstants.NOTIFICATION_PROMPT_CREATED, (promptResponseDto: IClientPrompt) => {
        const timestamp = Date.now();
        const prompt = useSelector((state: IRootState) => state.prompt.prompts[promptResponseDto.promptId] ?? state.prompt.uuidLookup[promptResponseDto.clientId] ?? new Prompt(promptResponseDto));
        if (prompt instanceof Prompt) prompt.onApiProcessed(promptResponseDto);
        dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: prompt, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_PROMPT_UPDATED, (promptResponseDto: IClientPrompt) => {
        const timestamp = Date.now();
        const prompt = useSelector((state: IRootState) => state.prompt.prompts[promptResponseDto.promptId] ?? state.prompt.uuidLookup[promptResponseDto.clientId] ?? new Prompt(promptResponseDto));
        if (prompt instanceof Prompt) prompt.onApiProcessed(promptResponseDto);
        dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: prompt, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_PROMPT_UPDATED, (promptResponseDto: IClientPrompt) => {
        const timestamp = Date.now();
        const prompt = useSelector((state: IRootState) => state.prompt.prompts[promptResponseDto.promptId] ?? state.prompt.uuidLookup[promptResponseDto.clientId] ?? new Prompt(promptResponseDto));
        if (prompt instanceof Prompt) prompt.onApiProcessed(promptResponseDto);
        dispatch({ type: promptConstants, payload: prompt, timestamp, suppressTimeoutAlert: false });
    });

    /**
     * RELATIONSHIP NOTIFICATIONS
     */
    penmanHubConnection.on(notificationConstants.NOTIFICATION_RELATIONSHIP_CREATED, (relationshipResponseDto: IClientRelationship) => {
        const timestamp = Date.now();
        const relationship = useSelector((state: IRootState) => state.relationship.relationships[relationshipResponseDto.relationshipId] ?? state.relationship.uuidLookup[relationshipResponseDto.clientId] ?? new Relationship(relationshipResponseDto));
        if (relationship instanceof Relationship) relationship.onApiProcessed(relationshipResponseDto);
        dispatch({ type: relationshipConstants.READ_RELATIONSHIP_SUCCESS, payload: relationship, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_RELATIONSHIP_UPDATED, (relationshipResponseDto: IClientRelationship) => {
        const timestamp = Date.now();
        const relationship = useSelector((state: IRootState) => state.relationship.relationships[relationshipResponseDto.relationshipId] ?? state.relationship.uuidLookup[relationshipResponseDto.clientId] ?? new Relationship(relationshipResponseDto));
        if (relationship instanceof Relationship) relationship.onApiProcessed(relationshipResponseDto);
        dispatch({ type: relationshipConstants.READ_RELATIONSHIP_SUCCESS, payload: relationship, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_RELATIONSHIP_UPDATED, (relationshipResponseDto: IClientRelationship) => {
        const timestamp = Date.now();
        const relationship = useSelector((state: IRootState) => state.relationship.relationships[relationshipResponseDto.relationshipId] ?? state.relationship.uuidLookup[relationshipResponseDto.clientId] ?? new Relationship(relationshipResponseDto));
        if (relationship instanceof Relationship) relationship.onApiProcessed(relationshipResponseDto);
        dispatch({ type: relationshipConstants, payload: relationship, timestamp, suppressTimeoutAlert: false });
    });

    /**
     * SHORT NOTIFICATIONS
     */
    penmanHubConnection.on(notificationConstants.NOTIFICATION_SHORT_CREATED, (shortResponseDto: IClientShort) => {
        const timestamp = Date.now();
        const short = useSelector((state: IRootState) => state.short.shorts[shortResponseDto.shortId] ?? state.short.uuidLookup[shortResponseDto.clientId] ?? new Short(shortResponseDto));
        if (short instanceof Short) short.onApiProcessed(shortResponseDto);
        dispatch({ type: shortConstants.READ_SHORT_SUCCESS, payload: short, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_SHORT_UPDATED, (shortResponseDto: IClientShort) => {
        const timestamp = Date.now();
        const short = useSelector((state: IRootState) => state.short.shorts[shortResponseDto.shortId] ?? state.short.uuidLookup[shortResponseDto.clientId] ?? new Short(shortResponseDto));
        if (short instanceof Short) short.onApiProcessed(shortResponseDto);
        dispatch({ type: shortConstants.READ_SHORT_SUCCESS, payload: short, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_SHORT_UPDATED, (shortResponseDto: IClientShort) => {
        const timestamp = Date.now();
        const short = useSelector((state: IRootState) => state.short.shorts[shortResponseDto.shortId] ?? state.short.uuidLookup[shortResponseDto.clientId] ?? new Short(shortResponseDto));
        if (short instanceof Short) short.onApiProcessed(shortResponseDto);
        dispatch({ type: shortConstants, payload: short, timestamp, suppressTimeoutAlert: false });
    });

    /**
     * TAG NOTIFICATIONS
     */
    penmanHubConnection.on(notificationConstants.NOTIFICATION_TAG_CREATED, (tagResponseDto: IClientTag) => {
        const timestamp = Date.now();
        const tag = useSelector((state: IRootState) => state.tag.tags[tagResponseDto.tagId] ?? state.tag.uuidLookup[tagResponseDto.clientId] ?? new Tag(tagResponseDto));
        if (tag instanceof Tag) tag.onApiProcessed(tagResponseDto);
        dispatch({ type: tagConstants.READ_TAG_SUCCESS, payload: tag, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_TAG_UPDATED, (tagResponseDto: IClientTag) => {
        const timestamp = Date.now();
        const tag = useSelector((state: IRootState) => state.tag.tags[tagResponseDto.tagId] ?? state.tag.uuidLookup[tagResponseDto.clientId] ?? new Tag(tagResponseDto));
        if (tag instanceof Tag) tag.onApiProcessed(tagResponseDto);
        dispatch({ type: tagConstants.READ_TAG_SUCCESS, payload: tag, timestamp, suppressTimeoutAlert: false });
    });
    penmanHubConnection.on(notificationConstants.NOTIFICATION_TAG_UPDATED, (tagResponseDto: IClientTag) => {
        const timestamp = Date.now();
        const tag = useSelector((state: IRootState) => state.tag.tags[tagResponseDto.tagId] ?? state.tag.uuidLookup[tagResponseDto.clientId] ?? new Tag(tagResponseDto));
        if (tag instanceof Tag) tag.onApiProcessed(tagResponseDto);
        dispatch({ type: tagConstants, payload: tag, timestamp, suppressTimeoutAlert: false });
    });

    /**
     * P2P NOTIFICATIONS
     */

/**
NOTIFICATION_USER_ACTIVATED: 'NOTIFICATION_USER_ACTIVATED',
NOTIFICATION_USER_MESSAGED: 'NOTIFICATION_USER_MESSAGED',
NOTIFICATION_USER_CONNECTION_REQUEST: 'NOTIFICATION_USER_CONNECTION_REQUEST',
NOTIFICATION_USER_SHARED_ENTITY: 'NOTIFICATION_USER_SHARED_ENTITY',
*/


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * SUBSCRIPTIONS
     */
    dispatch({ type: notificationConstants.SUBSCRIBE_PENMAN_HUB, payload: { penmanHubConnection, subscriptions, nginxHint: (nginxHint || 'default') }, timestamp });
    penmanHubConnection.start()
        .then(() => {
            /**
             * Connection lifetime:
             *      Once connection is established, subscribe to all shared entities and self.
             * 
             * When:
             *      1. Opening a file, notify collaborators (subset of friends, possibly friends of friends listed in collaborationReducer)
             *         that collaborationGroupGuid is active.
             *      2. When closing, notify collaborators that the current user is no longer active in collaborationGroupGuid room.
             *      3. Messages are processed in event listeners above: CREATE, UPDATE, DELETE, and P2P.
             */

            // subscribe to group == username to listen for P2P messages and targeted notifications
            const identitySubscriptionTimestamp = Date.now();
            dispatch({ type: notificationConstants.SUBSCRIBE_GROUP, payload: { penmanHubConnection, nginxHint, group: user.username }, timestamp: identitySubscriptionTimestamp });
            penmanHubConnection.invoke(notificationConstants.ADD_TO_GROUP_RPC, user.username)
                .then(() => {
                    dispatch({ type: notificationConstants.SUBSCRIBE_GROUP_SUCCESS, payload: { penmanHubConnection, nginxHint, group: user.username }, timestamp: identitySubscriptionTimestamp });
                })
                .catch((err) => {
                    // handle error, check for timeout
                    dispatch({ type: notificationConstants.SUBSCRIBE_GROUP_ERROR, error: err, timestamp: identitySubscriptionTimestamp });
                });

            // subscribe to all collaborations
            subscriptions?.forEach((roomId) => {
                const subscriptionTimestamp = Date.now();
                dispatch({ type: notificationConstants.SUBSCRIBE_GROUP, payload: { penmanHubConnection, nginxHint, group: roomId }, timestamp: subscriptionTimestamp });
                penmanHubConnection.invoke(notificationConstants.ADD_TO_GROUP_RPC, roomId)
                    .then(() => {
                        dispatch({ type: notificationConstants.SUBSCRIBE_GROUP_SUCCESS, payload: { penmanHubConnection, nginxHint, group: roomId }, timestamp: subscriptionTimestamp });
                    })
                    .catch((err) => {
                        // handle error, check for timeout
                        dispatch({ type: notificationConstants.SUBSCRIBE_GROUP_ERROR, error: err, timestamp: subscriptionTimestamp });
                    });
            });

            // dispatch SUCCESS
            dispatch({ type: notificationConstants.SUBSCRIBE_PENMAN_HUB_SUCCESS, payload: { penmanHubConnection, subscriptions, nginxHint }, timestamp });
        })
        .catch((err) => {
            // check for timeout
            // check for message payload, i.e. err.response.data
            dispatch({ type: notificationConstants.SUBSCRIBE_PENMAN_HUB_ERROR, payload: { penmanHubConnection, subscriptions, nginxHint }, error: err, timestamp });
        });
};

export const unsubscribePenmanHub = (penmanHubConnection: signalR.HubConnection) => {
    const dispatch = useDispatch();
    const timestamp = Date.now();
    dispatch({ type: notificationConstants.UNSUBSCRIBE_PENMAN_HUB, payload: penmanHubConnection, timestamp });
    penmanHubConnection.stop()
        .then(() => dispatch({ type: notificationConstants.UNSUBSCRIBE_PENMAN_HUB_SUCCESS, payload: penmanHubConnection, timestamp }))
        .catch((err) => {
            // handle error
            dispatch({ type: notificationConstants.UNSUBSCRIBE_PENMAN_HUB_ERROR, payload: penmanHubConnection, error: err, timestamp });
        });
};

export const unsubscribePenmanGroup = (penmanHubConnection: signalR.HubConnection, roomId: string) => {
    const dispatch = useDispatch();
    const timestamp = Date.now();
    dispatch({ type: notificationConstants.UNSUBSCRIBE_GROUP, payload: { penmanHubConnection, group: roomId }, timestamp });
    penmanHubConnection.invoke(notificationConstants.REMOVE_FROM_GROUP_RPC, roomId)
        .then(() => {
            dispatch({ type: notificationConstants.UNSUBSCRIBE_GROUP_SUCCESS, payload: { penmanHubConnection, group: roomId }, timestamp });
        })
        .catch((err) => {
            // handle error, check for timeout
            dispatch({ type: notificationConstants.UNSUBSCRIBE_GROUP_ERROR, payload: { penmanHubConnection, group: roomId }, error: err, timestamp });
        });
};
