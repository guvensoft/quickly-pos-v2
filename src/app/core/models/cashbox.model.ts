export class Cashbox {
    constructor(
        public type: string,
        public description: string,
        public timestamp: number,
        public cash: number,
        public card: number,
        public coupon: number,
        public user: string,
        public _id?: string,
        public _rev?: string,
        public category?: string
    ) { }
}

export enum CashboxType {
    PASSIVE,
    INCOME,
    OUTCOME
}

export type CashboxCategoryType = 'Gelir' | 'Gider';

export class CashboxCategory {
    constructor(
        public id: string,
        public name: string,
        public type: CashboxCategoryType,
    ) { }
}
