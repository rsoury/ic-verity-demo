# IC Verity Transparent Proxy Server

A high-performance, transparent proxy server built with Express.js and optimised for the Bun runtime. This proxy server is designed to seamlessly forward requests to your Internet Computer canisters or any other backend services.

## Features

- 🚀 **Transparent Proxying**: Automatically forwards all requests to a configured target
- 🔒 **Security**: Built-in security headers and CORS support
- 📊 **Logging**: Comprehensive request/response logging with Morgan
- 🏥 **Health Checks**: Built-in health monitoring endpoints
- ⚙️ **Configurable**: Environment-based configuration
- 🕐 **Timeout Handling**: Configurable request and proxy timeouts
- 🔄 **WebSocket Support**: Full WebSocket proxy capabilities
- 🍪 **Cookie Preservation**: Maintains session state across requests
- 🎯 **Path Rewriting**: Optional path transformation rules

## Prerequisites

- [Bun](https://bun.sh/) runtime (version 1.0.0 or higher)
- Node.js (for development dependencies)

## Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment:**
   ```bash
   cp config.env.example .env
   # Edit .env with your desired settings
   ```

3. **Start the proxy server:**
   ```bash
   # Development mode with auto-reload
   bun run dev
   
   # Production mode
   bun run start
   
   # Build for production
   bun run build
   ```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROXY_TARGET` | `http://localhost:3000` | Target URL to proxy requests to |
| `PORT` | `8080` | Port for the proxy server to listen on |
| `NODE_ENV` | `development` | Node.js environment |
| `LOG_LEVEL` | `info` | Logging level (silent, error, warn, info, debug) |
| `TIMEOUT` | `30000` | Request timeout in milliseconds |
| `PROXY_TIMEOUT` | `30000` | Proxy timeout in milliseconds |
| `SECURE` | `false` | Whether to use HTTPS for proxy requests |
| `CHANGE_ORIGIN` | `true` | Whether to change the origin header |

### Example Configuration

```bash
# .env
PROXY_TARGET=https://your-canister.ic0.app
PORT=9000
NODE_ENV=production
LOG_LEVEL=warn
TIMEOUT=60000
PROXY_TIMEOUT=60000
SECURE=true
CHANGE_ORIGIN=true
```

## Usage

### Basic Proxying

Once started, the proxy server will automatically forward all requests to your configured target:

```bash
# Request to proxy
curl http://localhost:8080/api/users

# Gets forwarded to
curl http://localhost:3000/api/users
```

### Health Monitoring

- **Health Check**: `GET /health`
- **Configuration**: `GET /config`

```bash
# Check server health
curl http://localhost:8080/health

# View current configuration
curl http://localhost:8080/config
```

### Proxying to Internet Computer

To proxy to your IC canisters:

```bash
# Set target to your canister
export PROXY_TARGET=https://your-canister.ic0.app

# Start the proxy
bun run start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health status |
| `/config` | GET | Current proxy configuration |
| `/*` | ALL | All other requests are proxied |

## Request/Response Headers

The proxy automatically adds these headers:

- `X-Forwarded-For`: Client IP address
- `X-Forwarded-Proto`: Client protocol
- `X-Forwarded-Host`: Client host
- `X-Proxy-By`: Proxy identification
- `X-Proxy-Target`: Target URL

## Logging

The server provides comprehensive logging:

- **Access Logs**: All HTTP requests (Morgan format)
- **Proxy Logs**: Request forwarding details
- **Error Logs**: Proxy errors and failures

Example log output:
```
[PROXY] GET /api/users -> http://localhost:3000/api/users
[PROXY] GET /api/users <- 200
```

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request sanitisation
- **Error Handling**: Secure error responses

## Development

### Project Structure

```
api/
├── index.ts          # Main proxy server
├── package.json      # Dependencies
└── config.env.example # Configuration template
```

### Available Scripts

- `bun run dev` - Development mode with auto-reload
- `bun run start` - Production mode
- `bun run build` - Build for production

### Adding Custom Middleware

You can extend the proxy server by adding custom middleware before the proxy:

```typescript
// Add custom middleware
app.use('/api', (req, res, next) => {
  // Custom logic here
  next();
});

// Then apply proxy
app.use('*', proxyMiddleware);
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the `PORT` environment variable
2. **Target unreachable**: Verify `PROXY_TARGET` is accessible
3. **CORS errors**: Check CORS configuration in your target service
4. **Timeout errors**: Increase `TIMEOUT` and `PROXY_TIMEOUT` values

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=debug
bun run start
```

## Performance

The proxy server is optimised for performance:

- **Bun Runtime**: Fast JavaScript/TypeScript execution
- **Efficient Proxying**: Minimal overhead for request forwarding
- **Connection Pooling**: Reuses connections when possible
- **Memory Management**: Efficient memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the configuration options
3. Check the logs for error details
4. Open an issue on the repository

---

**Built with ❤️ for the Internet Computer ecosystem**
