import { type DescMessage, type JsonValue, type Message, toJson } from "@bufbuild/protobuf";
import { ConnectError, type Interceptor, type UnaryRequest } from "@connectrpc/connect";

// Intercept messages and forward them to the gRPC-Web DevTools extension.
export const devtoolsInterceptor: Interceptor = (next) => async (req) => {
  if (req.stream) {
    return next(req); // skip streaming requests
  }

  // log unary calls
  const path = req.method.name;

  const reqObj = safeToJson(req.method.input, req.message);

  try {
    const result = await next(req);
    if (result.stream) {
      return {
        ...result,
        message: readMessage(req, reqObj, result.message),
      };
    }
    const resObj = safeToJson(req.method.output, result.message);
    window.postMessage(
      {
        method: path,
        methodType: "unary",
        request: reqObj,
        response: resObj,
        type: "__GRPCWEB_DEVTOOLS__",
      },
      "*",
    );
    return result;
  } catch (error) {
    if (error instanceof ConnectError) {
      window.postMessage(
        {
          error: {
            code: error?.code,
            message: `${error?.message}`,
            name: error?.name,
            stack: error?.stack,
          },
          method: path,
          methodType: "unary",
          request: reqObj,
          type: "__GRPCWEB_DEVTOOLS__",
        },
        "*",
      );
    } else if (error instanceof Error) {
      window.postMessage(
        {
          error: {
            code: 2,
            message: `${error?.message}`,
            name: error?.name,
            stack: error?.stack,
          },
          method: path,
          methodType: "unary",
          request: reqObj,
          type: "__GRPCWEB_DEVTOOLS__",
        },
        "*",
      );
    }

    throw error;
  }
};

// Convert a message to JSON, or return an error object if it fails. This
// prevents the interceptor from crashing the application.
function safeToJson(input: DescMessage, message: Message): JsonValue {
  try {
    return toJson(input, message);
  } catch (error) {
    return {
      error: `Unable to serialize request to JSON: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

// Read messages from a stream and forward them to the gRPC-Web DevTools
// extension.
async function* readMessage(req: UnaryRequest, reqObj: JsonValue, stream: AsyncIterable<Message>) {
  for await (const m of stream) {
    if (m) {
      const resp = safeToJson(req.method.output, m);
      window.postMessage(
        {
          type: "__GRPCWEB_DEVTOOLS__",
          methodType: "server_streaming",
          method: req.method.name,
          request: reqObj,
          response: resp,
        },
        "*",
      );
    }
    yield m;
  }
}
