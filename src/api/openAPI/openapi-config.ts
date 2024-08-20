import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
  schemaFile: './api-json.json',
  apiFile: './initChatAPI.ts',
  apiImport: 'chatApi',
  outputFile: './chatApi.ts',
  exportName: 'chatApi',
  hooks: true,
}

export default config