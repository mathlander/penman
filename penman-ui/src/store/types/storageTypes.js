export const persistenceTypes = {
    // never store
    forget: 0,
    // id, clientId, overlay
    feather: 1,
    // id, clientId, overlay, title, (possibly) summary
    light: 2,
    // everything
    heavy: 3,
};

export const storageRecordTypes = {
    authentication: 0,
    user: 1,
    prompt: 2,
};
