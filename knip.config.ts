import type { KnipConfig } from 'knip'

type WorkspaceConfig = Exclude<KnipConfig['workspaces'], undefined>[keyof KnipConfig['workspaces']]

const defaultWorkspaceConfig: WorkspaceConfig = {
  entry: ['src/index.ts', 'src/index-*.ts'],
  project: ['src/**/*.ts'],
  ignore: ['xy.config.ts'],
  typescript: {
    config: [
      'tsconfig.json',
    ],
  },
}

const config: KnipConfig = {
  workspaces: {
    '.': {
      ...defaultWorkspaceConfig,
      ignoreDependencies: [
        'eslint',
        '@typescript-eslint/eslint-plugin',
        'eslint-import-resolver-typescript',
        '@typescript-eslint/parser',
      ],
    },
  },
}

export default config
