import React, { Component, useState, useEffect } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';
import { create as createTag } from '../../store/actions/tagActions';
import { create as relate, deleteEntity as destroy } from '../../store/actions/relationshipActions';
import { IRootState, AuthenticatedUser, IReplayUser, Tag, Relationship, UUID } from '../../store/types';

interface ITagLineProps {
    authenticatedUser: AuthenticatedUser;
    isOffline: boolean;
    objectId: UUID;
    relationships: Relationship[];
};

const initChips: M.Chips[] = [];

function TagLine(props: ITagLineProps) {
    const [timestamp, setTimestamp] = useState(Date.now());
    const [chipInstances, setChipInstances] = useState(initChips);
    useEffect(() => {
        const existingRelationships = useSelector((state: IRootState) => state.relationship.objectUuidLookup[props.objectId]);
        const existingTags = useSelector((state: IRootState) => 
            Object.values(existingRelationships)
                .map(relationship => state.tag.uuidLookup[relationship.chipClientId])
                .filter(tag => !!tag));
        const existingPersonifications = useSelector((state: IRootState) =>
            Object.values(existingRelationships)
                .map(relationship => state.personification.uuidLookup[relationship.chipClientId])
                .filter(personification => !!personification));
        const tagline = document.querySelectorAll(`#tag-line-${timestamp}`);
        // add a chipNameLookup: Record<string, Tag | Personification> which will supply
        // the keys for the autocompleteData dictionary and facilitate constant time lookup
        // when called from onChipAdd
        const autocompleteData: M.AutocompleteData = {
            ...useSelector((state: IRootState) => Object.keys(state.tag.uuidLookup)
                .reduce((map: Record<string, string>, uuid: string) => {
                    const t = state.tag.uuidLookup[uuid];
                    // return map[t.tagName] = t.hasImage ? t.imageUrl : null;
                    map[t.tagName] = '';
                    return map;
                }, {})),
            ...useSelector((state: IRootState) => Object.keys(state.personification.uuidLookup)
                .reduce((map: Record<string, string>, uuid: string) => { 
                    const p = state.personification.uuidLookup[uuid];
                    map[`${p.firstName} ${p.middleName} ${p.lastName}`] = ''; // img url if one exists
                    return map;
                }, {})),
        };
        const instances = M.Chips.init(tagline, {
            placeholder: 'Tags',
            secondaryPlaceholder: '+Tag',
            data: existingTags.map(t => { return { tag: t.tagName } })
                .concat(existingPersonifications.map(p => { return { tag: `${p.firstName} ${p.middleName} ${p.lastName}` } })),
            onChipAdd: (element: Element, chip: Element) => {
                // call relate, { clientId: generateUuid(), objectClientId: props.objectId, chipClientId: chip.clientId }
                console.log(`onChipAdd: `, element, chip);
            },
            onChipSelect: (element: Element, chip: Element) => {
                // call update on the parent element, saving their data (or verify prompt), follow link to personification (or popup)
                // or go to a (new) tags page where they can view all other similarly tagged items... perhaps a search page?
                console.log(`onChipSelect: `, element, chip);
            },
            onChipDelete: (element: Element, chip: Element) => {
                console.log(`onChipDelete`, element, chip);
            },
            autocompleteOptions: {
                data: autocompleteData, // the complete list of tags and personifications
                minLength: 1,
                onAutocomplete: (text: string) => {
                    // probably do nothing, since onChipAdd creates the relationship
                    console.log(`onAutocomplete: ${text}`);
                },
            },
        });
        setChipInstances(instances);
        // clean-up
        const cleanUp = () => {
            chipInstances.forEach(instance => instance.destroy());
        };
    });
    return (
        <div id={`tag-line-${timestamp}`} className="chips" />
    );
}

export default TagLine;
