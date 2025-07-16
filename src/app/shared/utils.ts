/* eslint-disable @typescript-eslint/no-explicit-any */
import CryptoJS from 'crypto-js';
import { FieldValue, Timestamp } from 'firebase/firestore';
import type { Dictionary } from 'lodash';
import isEmpty from 'lodash/isEmpty';
import omitBy from 'lodash/omitBy';
import random from 'lodash/random';

// is first greater then second
export const compareTimestamps = (
    a: Timestamp | FieldValue | undefined,
    b: Timestamp | FieldValue | undefined,
): boolean => {
    if (!(a as Timestamp)?.toMillis || !(b as Timestamp)?.toMillis) {
        return false;
    }

    return (a as Timestamp).toMillis() > (b as Timestamp).toMillis();
};

export const compareTimestampsByValue = (
    a: Timestamp | FieldValue | number = 0,
    b: Timestamp | FieldValue | number = 0,
): number => {
    return (a?.valueOf() as number) - (b?.valueOf() as number);
};

export const compareStrings = (a = '', b = ''): number => {
    const aValue = a?.trim().toLowerCase();
    const bValue = b?.trim().toLowerCase();
    return aValue === bValue ? 0 : bValue < aValue ? 1 : -1;
};

export const compareObjectLengths = (a = {}, b = {}): number => Object.keys(b).length - Object.keys(a).length;

export const compareNumbers = (a = 0, b = 0): number => a - b;

export const sortBySequenceAsc = <T>(items: (T & { sequence: string })[]): T[] => {
    return (items || []).sort((a, b) => (a.sequence || '').toString().localeCompare(b.sequence || ''));
};

export const sortBySequenceNumAsc = (items: any[]): any[] => {
    return (items || []).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
};

export const sortByTimestamp = (items: any[]): any[] => {
    return (items || []).sort((a, b) => {
        const aUpdated = a.updated as any;
        const bUpdated = b.updated as any;
        return bUpdated?.toMillis() - aUpdated?.toMillis();
    });
};

export const sortByDateDesc
    = (field = 'created') =>
    (a: any, b: any) => {
        if (!a[field] || !b[field]) return 0;
        if (b[field].valueOf() < a[field].valueOf()) return -1;
        if (b[field].valueOf() > a[field].valueOf()) return 1;
        return 0;
    };

export const sortByDateAsc
    = (field = 'created') =>
    (a: any, b: any) => {
        if (!a[field] || !b[field]) return 0;
        if (b[field].valueOf() > a[field].valueOf()) return -1;
        if (b[field].valueOf() < a[field].valueOf()) return 1;
        return 0;
    };

export const sortByDateAndDirection
    = (field = 'startDate', direction: 'ASC' | 'DSC' = 'ASC') =>
    (a: any, b: any) => {
        if (!a[field] && b[field]) return direction === 'ASC' ? 1 : -1;
        if (a[field] && !b[field]) return direction === 'ASC' ? -1 : 1;
        if (!a[field] && !b[field]) return 0;
        if (b[field].valueOf() > a[field].valueOf()) return -1;
        if (b[field].valueOf() < a[field].valueOf()) return 1;
        return 0;
    };

export const sortByNumericPropertiesAsc = (items: any[], field: string): any[] => {
    return (items || []).sort((a, b) => (a[field] || 0) - (b[field] || 0));
};

export const sortByNumericPropertiesDesc = (items: any[], field: string): any[] => {
    return (items || []).sort((a, b) => (b[field] || 0) - (a[field] || 0));
};

export const sortByMultipleFields = (items: any[], mainField: string, field: string) => {
    return (items || []).sort((a, b) => a[mainField].localeCompare(b[mainField]) || b[field] - a[field]);
};

//deep compare two javascript objects
export const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) return a === b;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    if (a.prototype !== b.prototype) return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every((k) => isEqual(a[k], b[k]));
};

export const removeEmptyKeys = (dataOb: Record<string, unknown>): Record<string, unknown> => {
    // remove any keys that have null values, they will cause an error for firebase write
    return Object.keys(dataOb).reduce((accumulator: Record<string, unknown>, key) => {
        const value = dataOb[key];
        if (value !== null && value !== undefined && value !== '') {
            accumulator[key] = value;
        }
        return accumulator;
    }, {});
};

export const removeNoValuesKeys = <T>(dataOb: T): T => {
    // remove any keys that have null values, they will cause an error for firebase write
    return Object.keys(dataOb as Record<string, unknown>).reduce((accumulator, key) => {
        const value = (dataOb as { [key: string]: any })[key];
        if (!!value || value === false || value === 0) {
            (accumulator as { [key: string]: any })[key] = value;
        }
        return accumulator;
    }, {} as T);
};

export const sortObjectsByFieldAndOrder = <T extends Record<string, any>>(
    inputArray: T[],
    typeOrder: string[],
    fieldName: keyof T,
): T[] => {
    // Create a mapping from type to index
    const typeIndexMap: Record<string, number> = {};
    typeOrder.forEach((type, index) => {
        typeIndexMap[type] = index;
    });

    // Sort the input array based on the mapped index of the specified field
    const sortedArray = inputArray.sort((a, b) => {
        const aIndex = typeIndexMap[a[fieldName]];
        const bIndex = typeIndexMap[b[fieldName]];
        return aIndex - bIndex;
    });

    return sortedArray;
};

export const removeEmptyFields = <T>(dataOb: T): T => {
    // remove any fields that have null, undefined values or empty arrays, obj, strings
    return omitBy(dataOb as { [key: string]: any }, isEmpty) as T;
};

export const sortAlphabetically
    = <T = any>(field = 'name', direction: 'asc' | 'desc' = 'asc') =>
    (a: T, b: T) => {
        const firstValue = ((a as { [key: string]: any })[field] || '').trim().toLowerCase();
        const secondValue = ((b as { [key: string]: any })[field] || '').trim().toLowerCase();
        const sortOrder = direction === 'desc' ? 1 : -1;

        if (secondValue === firstValue) {
            return 0;
        }

        return secondValue > firstValue ? 1 * sortOrder : -1 * sortOrder;
    };

export const sortByAlphabetic = (items: any[], field: string): any[] => {
    return items.sort((a, b) =>
        a[field]?.toLowerCase() > b[field]?.toLowerCase()
            ? 1
            : b[field]?.toLowerCase() > a[field]?.toLowerCase()
            ? -1
            : 0,
    );
};

export const sortByAlphabeticDsc = (items: any[], field: string): any[] => {
    return items.sort((a, b) => (a[field] < b[field] ? 1 : b[field] < a[field] ? -1 : 0));
};

export const sortByObjectKeysCountAsc = (items: any[], field: string): any[] => {
    return items.sort((a, b) =>
        Object.keys(a[field] || {}).length > Object.keys(b[field] || {}).length
            ? 1
            : Object.keys(b[field] || {}).length > Object.keys(a[field] || {}).length
            ? -1
            : 0,
    );
};

export const trackByKey = (_: number, item: any): string => {
    return item.key;
};

export const trackById = (index: number, item: any): string => {
    return item ? item.id : '' + index;
};

export const trackByValue = (_: number, value: string): string => {
    return value;
};

export const filterObjectsById = (items: any[]): any[] => {
    return items.reduce((acc, data) => {
        const index = acc.findIndex(({ id }: any) => id === data.id);
        if (index === -1) {
            acc.push(data);
            return acc;
        }
        return acc;
    }, []);
};

export const getFileNameWithoutPrefix = (fileName: string): string => {
    const startIndex = fileName.indexOf('_') + 1;
    const lastIndex = fileName.lastIndexOf('.');
    return lastIndex === -1 ? fileName.slice(startIndex) : fileName.slice(startIndex, lastIndex);
};

export const convertMapToObject = (mapToConvert: Map<string, any>): any => {
    return [...mapToConvert.entries()].reduce((accumulator: any, [key, value]) => {
        accumulator[key] = value;
        return accumulator;
    }, {});
};

export const preventKeyValueOrder = (): number => 0;

// for dictionary [id]: string
export const alphabeticalKeyValueOrder = (a: { value: string }, b: { value: string }): number => {
    return (a.value || '').trim().toLowerCase() > (b.value || '').trim().toLowerCase() ? 1 : -1;
};

export const getRandomNumber = (max = 10, min = 1): number => {
    return random(min, max);
};

export const isTruncated = (event: Event): boolean => {
    const target = event.target as HTMLElement;

    if (!target) {
        return false;
    }
    if (target.scrollWidth && target.offsetWidth) {
        return target.scrollWidth <= target.offsetWidth;
    }

    return target.scrollWidth === 0;
};

export const getTimestampFromMilliseconds = (date: number): Timestamp | null => {
    if (!date) {
        return null;
    }

    return Timestamp.fromMillis(date) as Timestamp;
};

export const transformToDictionary = (array: any[], field: string, toBoolean = false): Dictionary<any> => {
    return array.reduce((acc, item) => {
        if (item?.[field]) {
            acc[item[field]] = toBoolean ? true : item;
        }

        return acc;
    }, {});
};

export const sortAlphabeticallyWithDate = (array: any[], fieldName: string, fieldDirection: string): any[] => {
    return array.sort((a, b) => {
        if (a[fieldName] && b[fieldName]) {
            if (fieldName === 'created' || fieldName === 'updated') {
                return fieldDirection.toUpperCase() === 'ASC'
                    ? a[fieldName]['_seconds'] - b[fieldName]['_seconds']
                    : b[fieldName]['_seconds'] - a[fieldName]['_seconds'];
            }
            if (fieldName === 'name' || fieldName === 'displayName') {
                return sortByCaseInAlpabetically(fieldName, fieldDirection, a, b);
            }
        }
    });
};
export const sortByCaseInAlpabetically = (
    fieldName: string,
    fieldDirection: string,
    a: { [key: string]: any },
    b: { [key: string]: any },
): any => {
    const isLetter = (str: string): boolean => str?.length === 1 && /[a-zA-Z]/i.test(str);
    const isDigit = (str: string): boolean => str?.length === 1 && /[0-9]/i.test(str);
    const isSpecialChar = (str: string): boolean => str?.length === 1 && !isLetter(str) && !isDigit(str);

    const charA = a ? a[fieldName]?.charAt(0) : null;
    const charB = b ? b[fieldName]?.charAt(0) : null;

    if (charA === charB) {
        return 0;
    }

    if ((isSpecialChar(charA) || isDigit(charA)) && !isSpecialChar(charB) && !isDigit(charB)) {
        return fieldDirection.toUpperCase() === 'ASC' ? -1 : 1;
    } else if ((isSpecialChar(charB) || isDigit(charB)) && !isSpecialChar(charA) && !isDigit(charA)) {
        return fieldDirection.toUpperCase() === 'ASC' ? 1 : -1;
    }

    const upperCharA = charA?.toUpperCase();
    const upperCharB = charB?.toUpperCase();

    if (upperCharA !== upperCharB) {
        if (fieldDirection.toUpperCase() === 'ASC') {
            return upperCharA < upperCharB ? -1 : 1;
        } else {
            return upperCharA < upperCharB ? 1 : -1;
        }
    }
    if (a[fieldName] !== b[fieldName]) {
        if (fieldDirection.toUpperCase() === 'ASC') {
            return a[fieldName] < b[fieldName] ? -1 : 1;
        } else {
            return a[fieldName] > b[fieldName] ? 1 : -1;
        }
    }
    return 0;
};

export const makeId = (length: number): string => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};

export const sortAlphabeticByCase = (array: any[]): any[] => {
    return array.sort((a, b) => {
        const sortA = a.name.charAt(0).toLowerCase();
        const sortB = b.name.charAt(0).toLowerCase();
        return sortA.localeCompare(sortB, 'en-US', { caseFirst: 'upper' });
    });
};

export const isTooltipDisabled = (elem: HTMLElement): boolean => {
    return elem.clientHeight ? elem.scrollHeight - 1 <= elem.clientHeight : false;
};

export const isTooltipDisabledByWidth = (elem: HTMLElement): boolean => {
    return elem.clientWidth ? elem.scrollWidth <= elem.clientWidth : false;
};

// for specific cases (firefox)
export const isDisabledTooltip = (elem: HTMLElement): boolean => {
    const reserveMargin = 2; // necessary indentation in container with text in visible area for reading fonts by different browsers
    return elem.scrollHeight <= elem.clientHeight || elem.scrollHeight - reserveMargin <= elem.clientHeight;
};

export const getStringWidth = (text: string, font: string, useExact?: boolean): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        return 0;
    }
    context.font = font;
    const metrics = context.measureText(text);
    return useExact ? metrics.width : Math.ceil(metrics.width);
};

export const isSafari = (): boolean => {
    const browserType = window.navigator.userAgent.toLowerCase();
    return browserType.indexOf('safari') > -1 && browserType.indexOf('chrome') < 0;
};

export const isFirefox = (): boolean => {
    const browserType = window.navigator.userAgent.toLowerCase();
    return browserType.indexOf('firefox') > -1 && browserType.indexOf('chrome') < 0;
};

export const isIOSDevice = (): boolean => {
    return (
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
            navigator.platform,
        )
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
};

export const isTouchDevice = () => {
    return window.matchMedia('(pointer: coarse)').matches;
};

export const formatToHTMLInClipboard = (
    name: string,
    imageUrl?: string,
    url?: string,
    password?: string,
    activity?: string,
): HTMLDivElement => {
    const img = document.createElement('img');
    img.src = imageUrl || '';
    img.style.setProperty('width', '94px');
    img.style.setProperty('height', '94px');

    const linkTitle = document.createElement('span');
    linkTitle.innerText = name;
    linkTitle.style.background = 'none';

    const activityName = document.createElement('span');
    activityName.innerText = activity || '';
    activityName.style.background = 'none';

    const linkLabel = document.createElement('span');
    linkLabel.innerText = 'Link: ';
    linkLabel.style.background = 'none';

    const link: any = document.createElement('a');
    link.href = url;
    link.text = url;
    link.style.background = 'none';

    const text: any = document.createElement('span');
    text.innerText = password;
    text.style.background = 'none';

    const br1 = document.createElement('br');
    const br2 = document.createElement('br');
    const br3 = document.createElement('br');
    const br4 = document.createElement('br');

    const container = document.createElement('div');
    container.style.setProperty('background-color', '#fff');
    container.style.setProperty('font-family', 'Graphik, \'Helvetica Neue\', sans-serif');
    container.style.setProperty('font-size', '14px');
    container.style.setProperty('line-height', '18px');
    container.style.setProperty('font-weight', '400');
    container.style.setProperty('inline-size', 'max-content');
    container.style.setProperty('color', '#151618');
    container.style.setProperty('padding', '16px 21px');
    container.style.setProperty('height', 'max-content');

    if (imageUrl) {
        container.appendChild(img);
        container.appendChild(br1);
    }
    container.appendChild(linkTitle);
    container.appendChild(br3);
    if (activity) {
        container.appendChild(activityName);
        container.appendChild(br4);
    }
    container.appendChild(linkLabel);
    container.appendChild(link);
    container.appendChild(br2);
    container.appendChild(text);
    return container;
};

export const sortDataWithLeadingId = (array: any[], leadingId: string): any[] => {
    return (array || []).sort((a, b) => {
        if (!!a.id && a.id === leadingId) return -1;
        if (!!b.id && b.id === leadingId) return 1;
        return 0;
    });
};

export const checkIfCapitalized = (a: string, b: string, direction: 'asc' | 'desc' = 'asc'): number => {
    const isCapitalized = (str: string) => str?.[0] === str?.[0].toUpperCase();
    if (isCapitalized(a) && !isCapitalized(b)) {
        return direction === 'asc' ? -1 : 1;
    }
    if (!isCapitalized(a) && isCapitalized(b)) {
        return direction === 'asc' ? 1 : -1;
    }
    return 0;
};

export const encrypt = (text: string, secretKey: string, iv: string): string => {
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(secretKey), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();

    return encrypted;
};

export const decrypt = (encryptedData: string, secretKey: string, iv: string): string => {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Hex.parse(secretKey), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    return decryptedText;
};
