/**
 * Shape of a translation file: every key of the English source must be present (as a string);
 * extra keys are allowed for languages with more plural forms (e.g. Russian `_few`, `_many`).
 */
export type Locale<T> = { [K in keyof T]: T[K] extends string ? string : Locale<T[K]> } & { [plural: string]: unknown }
