export interface FieldType {
    selected: boolean
    count: number
}

export interface PriceSlot {
    startTime: string
    endTime: string
    price: number
}

export interface FieldPricing {
    weekdays: PriceSlot[]
    weekends: PriceSlot[]
}

export type PricingData = {
    [key in 'field5' | 'field7' | 'field11']?: FieldPricing
}

export interface FieldFormData {
    fieldName: string
    fieldTypes: {
        field5: FieldType
        field7: FieldType
        field11: FieldType
    }
    description: string
    address: string
    latitude: number
    longitude: number
    phone: string
    email: string
    pricing: PricingData
    images: File[]
}
