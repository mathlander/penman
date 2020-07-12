export const mergePlainText = (original, modified, remote) => {
    // for now, just implement a placeholder
    if (original === modified) return remote;
    else if (original === remote) return modified;
    // otherwise split the texts into separate series and merge
    // ... this is going to be a long function, defer implementation until we have a test case
    return modified;
};

export const mergeRichText = (original, modified, remote) => {
    // for now, just implement a placeholder
    if (original === modified) return remote;
    else if (original === remote) return modified;
    // otherwise split the texts into separate series and merge
    // ... this is going to be a long function defer implementation until we have a test case
    return modified;
};
