import zlib from 'zlib';

export type UUID = string;

export const generateUuid: () => UUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]g/, (c) => {
        const r = (Math.round(Math.random() * 256) | 0) >> 4;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const deflateTextToBase64 = (input: string): string => zlib.deflateSync(input).toString('base64');

export const inflateBase64ToText = (input: string): string => zlib.inflateSync(input).toString();
