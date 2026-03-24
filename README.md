# @hasna/agent-utils

Shared utilities for token-efficient AI agent MCP servers and CLIs

[![npm](https://img.shields.io/npm/v/@hasna/agent-utils)](https://www.npmjs.com/package/@hasna/agent-utils)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

## Install

```bash
npm install -g @hasna/agent-utils
```

## Cloud Sync

This package supports cloud sync via `@hasna/cloud`:

```bash
cloud setup
cloud sync push --service agent-utils
cloud sync pull --service agent-utils
```

## Data Directory

Data is stored in `~/.hasna/agent-utils/`.

## License

Apache-2.0 -- see [LICENSE](LICENSE)
