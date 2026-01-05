export interface FieldType {
    selected: boolean
    count: number
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
}
