import AxiosClient from './AxiosClient';

export interface FieldPricingSlot {
  startTime: string;
  endTime: string;
  price: number | null;
  isConfigured: boolean;
  isPeakHour: boolean;
}

export interface FieldPricingResponse {
  fieldId: number;
  dayType: string;
  date: string;
  slots: FieldPricingSlot[];
}

const fieldApi = {
  getPricing: (fieldId: number, date: string): Promise<FieldPricingResponse> => {
    return AxiosClient.get(`/fields/${fieldId}/pricing`, {
      params: { date },
    }) as Promise<FieldPricingResponse>;
  },
};

export default fieldApi;
