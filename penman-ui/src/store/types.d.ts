import { History } from 'history';
import { UUID } from './utilities';
import { IError, ErrorCodes,
    nullError, apiUnreachableError } from './type-defs/error-types';
import { IOfflineState, IOfflineAction, IReplayUser, IReplayableAction } from './type-defs/offline-types';
import { IDashboardState, IDashboardAction } from './type-defs/dashboard-types';
import { INotificationState, INotificationAction } from './type-defs/notification-types';
import { IAuthenticationState, IAuthenticationAction, IAuthenticatedUser, IUserProfile,
    IAuthDto, ICreateUserDto, IDeleteUserDto, IRefreshDto, IUpdatePasswordDto, IUpdateProfileDto,
    AuthenticatedUser, nullUser, defaultAuthenticationState } from './type-defs/auth-types';
import { IBookState, IBookAction, IBook, IClientBook, IBookCollection,
    ICreateBookDto, IUpdateBookDto, IDeleteBookDto, IReadBookDto, IReadAllBooksDto,
    Book, nullBook, defaultBookState } from './type-defs/book-types';
import { IChapterState, IChapterAction, IChapter, IClientChapter, IChapterCollection,
    ICreateChapterDto, IUpdateChapterDto, IDeleteChapterDto, IReadChapterDto, IReadAllChaptersDto,
    Chapter, nullChapter, defaultChapterState } from './type-defs/chapter-types';
import { IPersonificationState, IPersonificationAction, IPersonification, IClientPersonification, IPersonificationCollection,
    ICreatePersonificationDto, IUpdatePersonificationDto, IDeletePersonificationDto, IReadPersonificationDto, IReadAllPersonificationsDto,
    Personification, nullPersonification, defaultPersonificationState } from './type-defs/personification-types';
import { IPromptState, IPromptAction, IPrompt, IClientPrompt, IPromptCollection,
    ICreatePromptDto, IUpdatePromptDto, IDeletePromptDto, IReadPromptDto, IReadAllPromptsDto,
    Prompt, nullPrompt, defaultPromptState } from './type-defs/prompt-types';
import { IShortState, IShortAction, IShort, IClientShort, IShortCollection,
    ICreateShortDto, IUpdateShortDto, IDeleteShortDto, IReadShortDto, IReadAllShortsDto,
    Short, nullShort, defaultShortState } from './type-defs/short-types';
import { ITagState, ITagAction, ITag, IClientTag, ITagCollection,
    ICreateTagDto, IUpdateTagDto, IDeleteTagDto, IReadTagDto, IReadAllTagsDto,
    Tag, nullTag, defaultTagState } from './type-defs/tag-types';
import { IRelationshipState, IRelationshipAction, IRelationship, IClientRelationship, IRelationshipCollection,
    ICreateRelationshipDto, IUpdateRelationshipDto, IDeleteRelationshipDto, IReadRelationshipDto, IReadAllRelationshipsDto,
    Relationship, nullRelationship, defaultRelationshipState } from './type-defs/relationship-types';

/**
 * Re-export all of the above types
 */

export { UUID } from './utilities';
export { IError, ErrorCodes, nullError, apiUnreachableError } from './type-defs/error-types';
export { IOfflineState, IOfflineAction, IReplayUser, IReplayableAction } from './type-defs/offline-types';
export { IDashboardState, IDashboardAction } from './type-defs/dashboard-types';
export { INotificationState, INotificationAction } from './type-defs/notification-types';
export { IAuthenticationState, IAuthenticationAction, IAuthenticatedUser, IUserProfile,
    IAuthDto, ICreateUserDto, IDeleteUserDto, IRefreshDto, IUpdatePasswordDto, IUpdateProfileDto,
    AuthenticatedUser, nullUser, defaultAuthenticationState } from './type-defs/auth-types';
export { IBookState, IBookAction, IBook, IClientBook, IBookCollection,
    ICreateBookDto, IUpdateBookDto, IDeleteBookDto, IReadBookDto, IReadAllBooksDto,
    Book, nullBook, defaultBookState } from './type-defs/book-types';
export { IChapterState, IChapterAction, IChapter, IClientChapter, IChapterCollection,
    ICreateChapterDto, IUpdateChapterDto, IDeleteChapterDto, IReadChapterDto, IReadAllChaptersDto,
    Chapter, nullChapter, defaultChapterState } from './type-defs/chapter-types';
export { IPersonificationState, IPersonificationAction, IPersonification, IClientPersonification, IPersonificationCollection,
    ICreatePersonificationDto, IUpdatePersonificationDto, IDeletePersonificationDto, IReadPersonificationDto, IReadAllPersonificationsDto,
    Personification, nullPersonification, defaultPersonificationState } from './type-defs/personification-types';
export { IPromptState, IPromptAction, IPrompt, IClientPrompt, IPromptCollection,
    ICreatePromptDto, IUpdatePromptDto, IDeletePromptDto, IReadPromptDto, IReadAllPromptsDto,
    Prompt, nullPrompt, defaultPromptState } from './type-defs/prompt-types';
export { IShortState, IShortAction, IShort, IClientShort, IShortCollection,
    ICreateShortDto, IUpdateShortDto, IDeleteShortDto, IReadShortDto, IReadAllShortsDto,
    Short, nullShort, defaultShortState } from './type-defs/short-types';
export { ITagState, ITagAction, ITag, IClientTag, ITagCollection,
    ICreateTagDto, IUpdateTagDto, IDeleteTagDto, IReadTagDto, IReadAllTagsDto,
    Tag, nullTag, defaultTagState } from './type-defs/tag-types';
export { IRelationshipState, IRelationshipAction, IRelationship, IClientRelationship, IRelationshipCollection,
    ICreateRelationshipDto, IUpdateRelationshipDto, IDeleteRelationshipDto, IReadRelationshipDto, IReadAllRelationshipsDto,
    Relationship, nullRelationship, defaultRelationshipState } from './type-defs/relationship-types';



/**
 * Export new composite types
 */
export interface IRootState {
    router: RouterState<History<HistoryLocationState>>,
    offline: IOfflineState,
    dashboard: IDashboardState,
    auth: IAuthenticationState,
    book: IBookState,
    chapter: IChapterState,
    personification: IPersonificationState,
    prompt: IPromptState,
    short: IShortState,
    tag: ITagState,
    relationship: IRelationshipState,
    notification: INotificationState,
};

// penman pseudo-namespace
export default {
    // utility types
    UUID,

    // error-types
    IError, ErrorCodes,
    nullError, apiUnreachableError,

    // offline-types
    IOfflineState, IOfflineAction, IReplayUser, IReplayableAction,

    // dashboard-types
    IDashboardState, IDashboardAction,

    // notification-types
    INotificationState, INotificationAction,

    // auth-types
    IAuthenticationState, IAuthenticationAction, IAuthenticatedUser, IUserProfile,
    IAuthDto, ICreateUserDto, IDeleteUserDto, IRefreshDto, IUpdatePasswordDto, IUpdateProfileDto,
    AuthenticatedUser, nullUser, defaultAuthenticationState,

    // book-types
    IBookState, IBookAction, IBook, IClientBook, IBookCollection,
    ICreateBookDto, IUpdateBookDto, IDeleteBookDto, IReadBookDto, IReadAllBooksDto,
    Book, nullBook, defaultBookState,

    // chapter-types
    IChapterState, IChapterAction, IChapter, IClientChapter, IChapterCollection,
    ICreateChapterDto, IUpdateChapterDto, IDeleteChapterDto, IReadChapterDto, IReadAllChaptersDto,
    Chapter, nullChapter, defaultChapterState,

    // personification-types
    IPersonificationState, IPersonificationAction, IPersonification, IClientPersonification, IPersonificationCollection,
    ICreatePersonificationDto, IUpdatePersonificationDto, IDeletePersonificationDto, IReadPersonificationDto, IReadAllPersonificationsDto,
    Personification, nullPersonification, defaultPersonificationState,

    // prompt-types
    IPromptState, IPromptAction, IPrompt, IClientPrompt, IPromptCollection,
    ICreatePromptDto, IUpdatePromptDto, IDeletePromptDto, IReadPromptDto, IReadAllPromptsDto,
    Prompt, nullPrompt, defaultPromptState,

    // short-types
    IShortState, IShortAction, IShort, IClientShort, IShortCollection,
    ICreateShortDto, IUpdateShortDto, IDeleteShortDto, IReadShortDto, IReadAllShortsDto,
    Short, nullShort, defaultShortState,

    // tag-types
    ITagState, ITagAction, ITag, IClientTag, ITagCollection,
    ICreateTagDto, IUpdateTagDto, IDeleteTagDto, IReadTagDto, IReadAllTagsDto,
    Tag, nullTag, defaultTagState,

    // relationship-types
    IRelationshipState, IRelationshipAction, IRelationship, IClientRelationship, IRelationshipCollection,
    ICreateRelationshipDto, IUpdateRelationshipDto, IDeleteRelationshipDto, IReadRelationshipDto, IReadAllRelationshipsDto,
    Relationship, nullRelationship, defaultRelationshipState,

    // types defined in this file
    IRootState,
};
