import {Preconditions} from '../Preconditions';
import {Optional} from './ts/Optional';

export class Arrays {

    public static first<T>(values: ReadonlyArray<T>): T | undefined {

        if (values.length === 0) {
            return undefined;
        }

        return values[0];

    }

    public static last<T>(values: ReadonlyArray<T>): T | undefined {

        if (values.length === 0) {
            return undefined;
        }

        return values[values.length - 1];

    }

    /**
     * Take N samples from the given input.
     * @param values
     */
    public static sample<T>(values: T[], count: number) {

        if (count === 0) {
            return [];
        }

        if (values.length <= count) {
            // we're done and already have enough samples.
            return values;
        }

        const result: T[] = [];

        const gap = Math.floor(values.length / count);

        for (let idx = 0; idx < values.length; idx += gap) {
            result.push(values[idx]);
        }

        return result;

    }

    /**
     * Convert an array to a dictionary.
     */
    public static toDict(val: {} | any[]): {[key: string]: any} {

        const isObject = typeof val === "object";
        const isArray = val instanceof Array;

        if (! isObject && ! isArray) {
            // only needed if we're called from JS.  Otherwise the compiler
            // will check the type.
            throw new Error("Neither an object or an array.");
        }

        if (isObject && ! isArray) {
            // already done as this is a dictionary though we might consider
            // making this a
            return val;
        }

        if (! isArray) {
            throw new Error("Not an array");
        }

        const result: {[key: string]: any} = {};

        const arrayVal: any[] = <any[]> val;

        for (let idx = 0; idx < arrayVal.length; ++idx) {
            result[idx] = arrayVal[idx];
        }

        return result;

    }

    /**
     * Go over the array-like object and return tuples with prev, curr, and next
     * properties so that we can peek at siblings easily.  If the prev and / or
     * next are not present these values are null.
     *
     * This can be used for algorithms that need to peek ahead or behind
     * inside an iterative algorithm
     */
    public static createSiblings<T>(arrayLikeObject: T[]) {

        Preconditions.assertNotNull(arrayLikeObject, "arrayLikeObject");

        /**
         * {Array<ArrayPosition>}
         * @type {Array}
         */
        const result = [];

        for (let idx = 0; idx < arrayLikeObject.length; ++idx) {

            result.push(new ArrayPosition<T>(
                Optional.of(arrayLikeObject[idx - 1]).getOrUndefined(),
                arrayLikeObject[idx],
                Optional.of(arrayLikeObject[idx + 1]).getOrUndefined()
            ));

        }

        return result;

    }

    /**
     * Take the input and return it as batch of lists based on the size.
     *
     * For example, if the batchSize is 2, and the input is a array of
     * integers,
     * and we're given [1, 2, 3, 4, 5] we will return [[1,2],[3,4],[5]]
     *
     * If trailing is false we only return collections that are full, not
     * partial. This is the last few if they don't equal the size.
     *
     */
    public static createBatches<T>(input: T[], batchSize: number): T[][] {

        const result: T[][] = [];

        let batch: T[] = [];

        input.forEach(current => {

            if (batch.length === batchSize) {
                result.push(batch);
                batch = [];
            }

            batch.push(current);

        });

        if (batch.length > 0) {
            result.push(batch);
        }

        return result;

    }

    /**
     * Like forEach but sequentially executes each function.
     */
    public static async asyncForEach<T>(items: T[], callback: AsyncCallback<T>) {

        for (const item of items) {
            await callback(item);
        }

    }

    /**
     * Shuffle the input as a new array.
     *
     * @param input
     */
    public static shuffle<T>(...input: T[]): T[] {

        const arr = Object.assign([], input);

        // noinspection TsLint
        let j, x, i;
        for (i = arr.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = arr[i];
            arr[i] = arr[j];
            arr[j] = x;
        }

        return arr;

    }

    /**
     * Get up to `limit` values from the given input.
     * @param input
     */
    public static head<T>(input: ReadonlyArray<T>, limit: number): T[] {

        // adjust the limit so we never fetch too many values.
        limit = Math.min(limit, input.length);

        const result: T[] = [];

        for (let idx = 0; idx < limit; ++idx) {
            result[idx] = input[idx];
        }

        return result;

    }

    /**
     * Return true if the given `list` has any of the elements in `items`
     */
    public static hasAny<T>(list: ReadonlyArray<T>, items: ReadonlyArray<T>) {

        for (const item of items) {

            if (list.includes(item)) {
                return true;
            }

        }

        return false;

    }

}

export interface AsyncCallback<T> {
    (current: T): Promise<void>;
}

/**
 * Represents a 'position' object for createSiblings() that has a curr
 * (current), prev (previous), and next references for working with lists of
 * objects.  The position allow sus to know where we currently are but also the
 * previous and future states.
 */
class ArrayPosition<T> {

    public readonly prev?: T;

    public readonly curr: T;

    public readonly next?: T;

    constructor(prev: T | undefined, curr: T, next: T | undefined) {
        this.prev = prev;
        this.curr = curr;
        this.next = next;
    }

}
