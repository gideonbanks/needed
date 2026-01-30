export const REQUEST_DETAILS_STORAGE_KEY = "request:details"

export const getRequestSendTokenStorageKey = (requestId: string) =>
  `request:send-token:${requestId}`
