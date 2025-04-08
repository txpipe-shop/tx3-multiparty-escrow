import { IncomingMessage, ServerResponse } from "http";
import { generateRequestId, REQUEST_ID_HEADER } from "../constant.ts";
import { context } from "../../context.ts";

/**
 * This is an express middleware that:
 * - Generate/Use request id (depending on if you already have one in the request header)
 * - Add it to the request context
 *
 * **Important:** this should be your first middleware
 */
export function addRequestId(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  let requestId = req.headers[REQUEST_ID_HEADER];

  if (!requestId) {
    requestId = generateRequestId();
    req.headers[REQUEST_ID_HEADER] = requestId;
  }

  res.setHeader(REQUEST_ID_HEADER, requestId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentContext: any = context().getStore();

  if (currentContext) {
    // Append to the current context
    currentContext.requestId = requestId;
    next();
    return;
  }

  context().run({ requestId }, next);
}
