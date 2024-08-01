# ConnectRPC Devtools Interceptor

This package contains a [ConnectRPC interceptor](https://connectrpc.com/docs/web/interceptors) that will forward information to the [gRPC-Web DevTools extension](https://github.com/SafetyCulture/grpc-web-devtools), allowing you to easily debug the contents of ConnectRPC requests. Which the gRPC-Web DevTools extension ships with its own interceptor for Connect V1, that interceptor crashes when used with Connect V2. This package only supports Connect V2.

Install:

```sh
npm install connect-devtools
```

Add it to your Connect client:

```ts
import { createPromiseClient, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { devtoolsInterceptor } from 'connect-devtools';

const interceptors: Interceptor[] = [
  // whatever other interceptors you want
];

// Only install the devtools interceptor if the gRPC-Web Devtools extension is available
if ("window" in globalThis && "__CONNECT_WEB_DEVTOOLS__" in globalThis.window) {
  interceptors.push(devtoolsInterceptor);
}

const transport = createConnectTransport({
  baseUrl: endpoint,
  interceptors,
});

const client = createPromiseClient(definition, transport);
```

# Development

* `pnpm start` - build the package
* `pnpm test` - test the package
* TODO: GitHub workflow to publish the package
* TODO: Tests