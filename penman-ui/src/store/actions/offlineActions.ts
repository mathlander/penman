import { IAuthenticatedUser, IReplayableAction } from '../types';

export const replayMementos = (user: IAuthenticatedUser, replayableActions: IReplayableAction[], suppressTimeoutAlert = true) => {
    replayableActions
        .forEach((replayableAction) => replayableAction.memento(user, suppressTimeoutAlert));
};
