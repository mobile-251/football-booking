import { SetMetadata } from '@nestjs/common';

export const VENUE_SCOPE_PARAM_KEY = 'venueScopeParam';

/** Param name on the route that holds the venue id (e.g. venueId or id). */
export const VenueScope = (paramName = 'venueId') =>
  SetMetadata(VENUE_SCOPE_PARAM_KEY, paramName);
